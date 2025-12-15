import { IEntitySpawner, IEntityRegistry } from '@/engine/interfaces';
import { Entity } from '@/engine/ecs/Entity';
import { Tag } from '@/engine/ecs/types';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { ARCHETYPES } from '@/sys/config/Archetypes';
import { ComponentBuilder } from './ComponentBuilder';
import { ArchetypeIDs } from '@/sys/config/Identifiers';

export class EntitySpawner implements IEntitySpawner {
  private registry: EntityRegistry;

  constructor(registry: IEntityRegistry) {
    this.registry = registry as EntityRegistry;
  }

  public spawn(archetypeId: string, overrides: Record<string, any> = {}, extraTags: Tag[] = []): Entity {
    const blueprint = ARCHETYPES[archetypeId];
    if (!blueprint) {
        console.warn('[EntitySpawner] Unknown archetype: ' + archetypeId);
        return this.registry.createEntity();
    }

    const e = this.registry.createEntity();
    
    blueprint.tags.forEach(tag => e.addTag(tag));
    extraTags.forEach(tag => e.addTag(tag));

    for (const compDef of blueprint.components) {
        const builder = ComponentBuilder[compDef.type];
        if (builder) {
            const runtimeData = overrides[compDef.type] || {};
            const mergedData = { ...compDef.data, ...runtimeData };
            e.addComponent(builder(mergedData));
        }
    }

    this.registry.updateCache(e);
    return e;
  }

  public spawnPlayer(): Entity {
    return this.spawn(ArchetypeIDs.PLAYER);
  }

  public spawnEnemy(type: string, x: number, y: number): Entity {
    return this.spawn(type, {
        Transform: { x, y }
    });
  }

  public spawnBullet(
      x: number, y: number, 
      vx: number, vy: number, 
      isEnemy: boolean, 
      life: number,
      damage: number = 1,
      widthMult: number = 1.0
  ): Entity {
    const id = isEnemy ? ArchetypeIDs.BULLET_ENEMY : ArchetypeIDs.BULLET_PLAYER;
    const rotation = Math.atan2(vy, vx);

    return this.spawn(id, {
        Transform: { x, y, rotation, scale: widthMult },
        Motion: { vx, vy },
        Lifetime: { remaining: life, total: life },
        Combat: { damage },
        Health: { max: damage },
        Collider: { 
            radius: (ARCHETYPES[id].components.find(c => c.type === 'Collider')?.data.radius || 0.2) * widthMult 
        }
    });
  }

  public spawnParticle(x: number, y: number, color: string, vx: number, vy: number, life: number): void {
    const e = this.registry.createEntity();
    e.addTag(Tag.PARTICLE);
    
    e.addComponent(ComponentBuilder.Transform({ x, y }));
    e.addComponent(ComponentBuilder.Motion({ vx, vy, friction: 0.05 }));
    e.addComponent(ComponentBuilder.Lifetime({ remaining: life, total: life }));
    e.addComponent(ComponentBuilder.Identity({ variant: color }));
    
    this.registry.updateCache(e);
  }
}
