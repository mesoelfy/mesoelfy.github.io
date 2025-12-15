import { IEntitySpawner, IEntityRegistry } from '@/engine/interfaces';
import { Entity } from '@/engine/ecs/Entity';
import { Tag } from '@/engine/ecs/types';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { ARCHETYPES } from '@/sys/config/Archetypes';
import { ComponentBuilder } from './ComponentBuilder';
import { ArchetypeIDs, EnemyTypes } from '@/sys/config/Identifiers';
import { ComponentType } from '@/engine/ecs/ComponentType';

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
        [ComponentType.Transform]: { x, y }
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
    
    // Determine Color based on Bullet Type (or override later)
    // Daemon shots will be colored via BehaviorSystem injecting RenderData
    // Standard shots use Archetype defaults.
    
    // Note: RenderData is already on the archetype.
    // If we want custom colors per bullet type beyond archetype, we pass it in overrides.
    
    return this.spawn(id, {
        [ComponentType.Transform]: { x, y, rotation, scale: widthMult },
        [ComponentType.Motion]: { vx, vy },
        [ComponentType.Lifetime]: { remaining: life, total: life },
        [ComponentType.Combat]: { damage },
        [ComponentType.Health]: { max: damage },
        [ComponentType.Collider]: { 
            radius: (ARCHETYPES[id].components.find(c => c.type === ComponentType.Collider)?.data.radius || 0.2) * widthMult 
        }
    });
  }

  public spawnParticle(x: number, y: number, color: string, vx: number, vy: number, life: number): void {
    const e = this.registry.createEntity();
    e.addTag(Tag.PARTICLE);
    
    e.addComponent(ComponentBuilder[ComponentType.Transform]({ x, y }));
    e.addComponent(ComponentBuilder[ComponentType.Motion]({ vx, vy, friction: 0.05 }));
    e.addComponent(ComponentBuilder[ComponentType.Lifetime]({ remaining: life, total: life }));
    e.addComponent(ComponentBuilder[ComponentType.Identity]({ variant: color }));
    
    this.registry.updateCache(e);
  }
}
