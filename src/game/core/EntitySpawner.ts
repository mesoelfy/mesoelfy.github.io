import { IEntitySpawner, IEntityRegistry } from './interfaces';
import { Entity } from './ecs/Entity';
import { Tag } from './ecs/types';
import { PLAYER_CONFIG } from '../config/PlayerConfig';
import { PhysicsConfig, CollisionLayers } from '../config/PhysicsConfig';
import { EntityRegistry } from './ecs/EntityRegistry';
import { ARCHETYPES } from '../data/Archetypes';
import { ComponentBuilder } from './ComponentBuilder';

export class EntitySpawner implements IEntitySpawner {
  private registry: EntityRegistry;

  constructor(registry: IEntityRegistry) {
    this.registry = registry as EntityRegistry;
  }

  public spawnPlayer(): Entity {
    const e = this.registry.createEntity();
    e.addTag(Tag.PLAYER);
    
    e.addComponent(ComponentBuilder.Transform({ x: 0, y: 0, rotation: 0, scale: 1 }));
    e.addComponent(ComponentBuilder.Motion({ friction: 0.9 }));
    e.addComponent(ComponentBuilder.Health({ max: PLAYER_CONFIG.maxHealth }));
    e.addComponent(ComponentBuilder.State({ current: 'IDLE' }));
    e.addComponent(ComponentBuilder.Collider({ radius: PhysicsConfig.HITBOX.PLAYER, layer: CollisionLayers.PLAYER, mask: PhysicsConfig.MASKS.PLAYER }));
    
    this.registry.updateCache(e);
    return e;
  }

  public spawnEnemy(type: string, x: number, y: number): Entity {
    const archetype = ARCHETYPES[type];
    if (!archetype) {
        console.warn(`[EntitySpawner] Unknown archetype: ${type}`);
        return this.registry.createEntity();
    }

    const e = this.registry.createEntity();
    archetype.tags.forEach(tag => e.addTag(tag));

    for (const compDef of archetype.components) {
        if (compDef.type === 'Transform') continue;
        const builder = ComponentBuilder[compDef.type];
        if (builder) {
            // Clone data to prevent mutation of Archetype definition
            const freshData = { ...compDef.data }; 
            e.addComponent(builder(freshData));
        }
    }

    e.addComponent(ComponentBuilder.Transform({ x, y, rotation: 0, scale: 1 }));
    this.registry.updateCache(e);
    return e;
  }

  public spawnBullet(
      x: number, y: number, 
      vx: number, vy: number, 
      isEnemy: boolean, 
      life: number,
      damage: number = 1,
      widthMult: number = 1.0
  ): Entity {
    const e = this.registry.createEntity();
    e.addTag(Tag.BULLET);
    if (isEnemy) e.addTag(Tag.ENEMY); else e.addTag(Tag.PLAYER); 
    
    e.addComponent(ComponentBuilder.Transform({ 
        x, y, 
        rotation: Math.atan2(vy, vx), 
        scale: widthMult 
    }));
    e.addComponent(ComponentBuilder.Motion({ vx, vy }));
    e.addComponent(ComponentBuilder.Lifetime({ remaining: life, total: life }));
    e.addComponent(ComponentBuilder.Health({ max: damage }));
    e.addComponent(ComponentBuilder.Combat({ damage }));

    const layer = isEnemy ? CollisionLayers.ENEMY_PROJECTILE : CollisionLayers.PLAYER_PROJECTILE;
    const mask = isEnemy ? PhysicsConfig.MASKS.ENEMY_PROJECTILE : PhysicsConfig.MASKS.PLAYER_PROJECTILE;
    const baseRadius = isEnemy ? PhysicsConfig.HITBOX.HUNTER_BULLET : PhysicsConfig.HITBOX.BULLET;
    
    e.addComponent(ComponentBuilder.Collider({ 
        radius: baseRadius * widthMult, 
        layer, 
        mask 
    }));
    
    this.registry.updateCache(e);
    return e;
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
