import { IEntitySpawner, IEntityRegistry } from '@/core/interfaces';
import { Entity } from '@/core/ecs/Entity';
import { Tag } from '@/core/ecs/types';
import { EntityRegistry } from '@/core/ecs/EntityRegistry';
import { ARCHETYPES } from '@/game/config/Archetypes';
import { ComponentBuilder } from './ComponentBuilder';
import { ArchetypeIDs } from '@/game/config/Identifiers';
import { ComponentType } from '@/core/ecs/ComponentType';
import { PROJECTILE_CONFIG } from '@/game/config/ProjectileConfig';

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
    const config = PROJECTILE_CONFIG[projectileId] || PROJECTILE_CONFIG['PLAYER_STANDARD'];
    
    return this.spawn(id, {
        [ComponentType.Transform]: { x, y, rotation, scale: 1.0 }, 
        [ComponentType.Motion]: { vx, vy },
        [ComponentType.Lifetime]: { remaining: life, total: life },
        [ComponentType.Combat]: { damage },
        [ComponentType.Health]: { max: damage },
        [ComponentType.Render]: { visualScale: 1.0, visualRotation: 0 },
        [ComponentType.Projectile]: { configId: projectileId, state: 'FLIGHT' }
    });
  }

  public spawnParticle(x: number, y: number, color: string, vx: number, vy: number, life: number, size: number = 1.0, shape: number = 0): void {
    const e = this.registry.createEntity();
    e.addTag(Tag.PARTICLE);
    
    // We store shape in Identity for Entity-based particles? 
    // No, entity based particles are different from the IParticleSystem implementation.
    // This method spawns an ENTITY particle (heavyweight).
    // The IParticleSystem spawns a LIGHTWEIGHT particle.
    // The previous implementation of EntitySpawner.spawnParticle used ECS.
    // We should keep it consistent but it seems unused in current loop?
    // HunterLogic uses ServiceLocator.getParticleSystem(), not Spawner.spawnParticle.
    // So this method might be legacy or for special particles.
    
    e.addComponent(ComponentBuilder[ComponentType.Transform]({ x, y, scale: size }));
    e.addComponent(ComponentBuilder[ComponentType.Motion]({ vx, vy, friction: 0.05 }));
    e.addComponent(ComponentBuilder[ComponentType.Lifetime]({ remaining: life, total: life }));
    e.addComponent(ComponentBuilder[ComponentType.Identity]({ variant: color }));
    // We are ignoring shape here for entity particles unless we add a component for it.
    
    this.registry.updateCache(e);
  }
}
