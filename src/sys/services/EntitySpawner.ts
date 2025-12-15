import { IEntitySpawner, IEntityRegistry } from '@/engine/interfaces';
import { Entity } from '@/engine/ecs/Entity';
import { Tag } from '@/engine/ecs/types';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { ARCHETYPES } from '@/sys/config/Archetypes';
import { ComponentBuilder } from './ComponentBuilder';
import { ArchetypeIDs } from '@/sys/config/Identifiers';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { PROJECTILE_CONFIG } from '@/sys/config/ProjectileConfig';

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
      projectileId: string = 'PLAYER_STANDARD'
  ): Entity {
    const id = isEnemy ? ArchetypeIDs.BULLET_ENEMY : ArchetypeIDs.BULLET_PLAYER;
    const rotation = Math.atan2(vy, vx);
    
    // Config Lookup
    const config = PROJECTILE_CONFIG[projectileId] || PROJECTILE_CONFIG['PLAYER_STANDARD'];
    
    // IMPORTANT: RenderData is now mostly controlled by the Renderer reading the Config,
    // BUT we still init it so other systems (like Physics/Collisions) don't crash 
    // if they try to access RenderData for debug visuals or bounding boxes.
    
    return this.spawn(id, {
        [ComponentType.Transform]: { x, y, rotation, scale: 1.0 }, // Config scale handles the rest
        [ComponentType.Motion]: { vx, vy },
        [ComponentType.Lifetime]: { remaining: life, total: life },
        [ComponentType.Combat]: { damage },
        [ComponentType.Health]: { max: damage },
        [ComponentType.Render]: { visualScale: 1.0, visualRotation: 0 },
        [ComponentType.Projectile]: { configId: projectileId, state: 'FLIGHT' }
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
