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

    // 1. Build Components First
    for (const compDef of archetype.components) {
        // Skip Transform in the builder loop if we want to enforce the spawned position
        if (compDef.type === 'Transform') continue;

        const builder = ComponentBuilder[compDef.type];
        if (builder) {
            // Deep clone to prevent shared references across entities
            const freshData = JSON.parse(JSON.stringify(compDef.data || {}));
            e.addComponent(builder(freshData));
        }
    }

    // 2. Explicitly Set Transform (Overrides any defaults)
    e.addComponent(new TransformComponent(x, y, 0, 1));

    this.registry.updateCache(e);
    return e;
  }

  public spawnBullet(x: number, y: number, vx: number, vy: number, isEnemy: boolean, life: number): Entity {
    const e = this.registry.createEntity();
    e.addTag(Tag.BULLET);
    if (isEnemy) e.addTag(Tag.ENEMY); else e.addTag(Tag.PLAYER); 
    e.addComponent(new TransformComponent(x, y, Math.atan2(vy, vx), 1));
    e.addComponent(new MotionComponent(vx, vy, 0));
    e.addComponent(new LifetimeComponent(life, life));
    e.addComponent(new CombatComponent(1)); 

    const layer = isEnemy ? CollisionLayers.ENEMY_PROJECTILE : CollisionLayers.PLAYER_PROJECTILE;
    const mask = isEnemy ? PhysicsConfig.MASKS.ENEMY_PROJECTILE : PhysicsConfig.MASKS.PLAYER_PROJECTILE;
    const radius = isEnemy ? PhysicsConfig.HITBOX.HUNTER_BULLET : PhysicsConfig.HITBOX.BULLET;

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
