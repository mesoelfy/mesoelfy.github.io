import { IEntitySpawner, IEntityRegistry } from './interfaces';
import { Entity } from './ecs/Entity';
import { Tag } from './ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { MotionComponent } from '../components/data/MotionComponent';
import { HealthComponent } from '../components/data/HealthComponent';
import { LifetimeComponent } from '../components/data/LifetimeComponent';
import { CombatComponent } from '../components/data/CombatComponent';
import { StateComponent } from '../components/data/StateComponent';
import { ColliderComponent } from '../components/data/ColliderComponent'; 
import { IdentityComponent } from '../components/data/IdentityComponent';
import { PLAYER_CONFIG } from '../config/PlayerConfig';
import { PhysicsConfig, CollisionLayers } from '../config/PhysicsConfig';
import { EntityRegistry } from './ecs/EntityRegistry';
import { EnemyTypes } from '../config/Identifiers';
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
    e.addComponent(new TransformComponent(0, 0, 0, 1));
    e.addComponent(new MotionComponent(0, 0, 0.9)); 
    e.addComponent(new HealthComponent(PLAYER_CONFIG.maxHealth));
    e.addComponent(new StateComponent('IDLE')); 
    e.addComponent(new ColliderComponent(PhysicsConfig.HITBOX.PLAYER, CollisionLayers.PLAYER, PhysicsConfig.MASKS.PLAYER));
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
            const freshData = JSON.parse(JSON.stringify(compDef.data || {}));
            e.addComponent(builder(freshData));
        }
    }

    e.addComponent(new TransformComponent(x, y, 0, 1));
    this.registry.updateCache(e);
    return e;
  }

  // UPDATED: Accepts Damage and Width Multiplier
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
    
    // Transform with Width Scaling
    const t = new TransformComponent(x, y, Math.atan2(vy, vx), 1);
    
    // NOTE: We don't have separate ScaleX/Y in TransformComponent yet (it uses uniform 'scale').
    // BUT we can use the 'scale' property for width if we assume length is handled by the renderer geometry.
    // Actually, BulletRenderer uses PlaneGeometry(1.2, 1.2).
    // Let's overload 'scale' to mean Width Multiplier for Bullets.
    t.scale = widthMult; 
    
    e.addComponent(t);
    e.addComponent(new MotionComponent(vx, vy, 0));
    e.addComponent(new LifetimeComponent(life, life));
    
    // Health = Damage (Mass)
    e.addComponent(new HealthComponent(damage));
    e.addComponent(new CombatComponent(damage)); 

    const layer = isEnemy ? CollisionLayers.ENEMY_PROJECTILE : CollisionLayers.PLAYER_PROJECTILE;
    const mask = isEnemy ? PhysicsConfig.MASKS.ENEMY_PROJECTILE : PhysicsConfig.MASKS.PLAYER_PROJECTILE;
    
    // Collider Radius scales with Width
    const baseRadius = isEnemy ? PhysicsConfig.HITBOX.HUNTER_BULLET : PhysicsConfig.HITBOX.BULLET;
    const radius = baseRadius * widthMult;

    e.addComponent(new ColliderComponent(radius, layer, mask));
    this.registry.updateCache(e);
    return e;
  }

  public spawnParticle(x: number, y: number, color: string, vx: number, vy: number, life: number): void {
    const e = this.registry.createEntity();
    e.addTag(Tag.PARTICLE);
    e.addComponent(new TransformComponent(x, y, 0, 1));
    e.addComponent(new MotionComponent(vx, vy, 0.05));
    e.addComponent(new LifetimeComponent(life, life));
    e.addComponent(new IdentityComponent(color));
    this.registry.updateCache(e);
  }
}
