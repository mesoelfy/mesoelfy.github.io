import { IEntitySpawner, IEntityRegistry } from './interfaces';
import { Entity } from './ecs/Entity';
import { Tag } from './ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { MotionComponent } from '../components/data/MotionComponent';
import { HealthComponent } from '../components/data/HealthComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { LifetimeComponent } from '../components/data/LifetimeComponent';
import { CombatComponent } from '../components/data/CombatComponent';
import { StateComponent } from '../components/data/StateComponent';
import { ENEMY_CONFIG } from '../config/EnemyConfig';
import { PLAYER_CONFIG } from '../config/PlayerConfig';
import { EntityRegistry } from './ecs/EntityRegistry';

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
    this.registry.updateCache(e);
    return e;
  }

  public spawnEnemy(type: string, x: number, y: number): Entity {
    const config = ENEMY_CONFIG[type];
    const e = this.registry.createEntity();
    
    e.addTag(Tag.ENEMY);
    e.addTag(Tag.OBSTACLE);

    e.addComponent(new TransformComponent(x, y, 0, 1));
    e.addComponent(new IdentityComponent(type));
    e.addComponent(new MotionComponent(0, 0, 0, 0)); 
    e.addComponent(new HealthComponent(config.hp));
    
    // NEW: Spawn Timer (1.5s materialization)
    e.addComponent(new StateComponent('SPAWN', { spawn: 1.5 })); 
    
    if (config.damage) {
        e.addComponent(new CombatComponent(config.damage));
    }

    this.registry.updateCache(e);
    return e;
  }

  public spawnBullet(
    x: number, y: number, 
    vx: number, vy: number, 
    isEnemy: boolean, 
    life: number
  ): Entity {
    const e = this.registry.createEntity();
    e.addTag(Tag.BULLET);
    if (isEnemy) e.addTag(Tag.ENEMY); 
    else e.addTag(Tag.PLAYER); 

    e.addComponent(new TransformComponent(x, y, Math.atan2(vy, vx), 1));
    e.addComponent(new MotionComponent(vx, vy, 0));
    e.addComponent(new LifetimeComponent(life, life));
    e.addComponent(new CombatComponent(1)); 

    this.registry.updateCache(e);
    return e;
  }

  public spawnParticle(
    x: number, y: number, 
    color: string, 
    vx: number, vy: number, 
    life: number
  ): void {
    const e = this.registry.createEntity();
    e.addTag(Tag.PARTICLE);
    e.addComponent(new TransformComponent(x, y, 0, 1));
    e.addComponent(new MotionComponent(vx, vy, 0.05));
    e.addComponent(new LifetimeComponent(life, life));
    e.addComponent(new IdentityComponent(color));
    this.registry.updateCache(e);
  }
}
