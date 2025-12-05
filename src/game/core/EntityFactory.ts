import { Registry } from './ecs/EntityRegistry';
import { Entity } from './ecs/Entity';
import { Tag } from './ecs/types';

// Components
import { TransformComponent } from '../components/data/TransformComponent';
import { MotionComponent } from '../components/data/MotionComponent';
import { HealthComponent } from '../components/data/HealthComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { LifetimeComponent } from '../components/data/LifetimeComponent';
import { CombatComponent } from '../components/data/CombatComponent';
import { StateComponent } from '../components/data/StateComponent'; // NEW

// Configs
import { ENEMY_CONFIG } from '../config/EnemyConfig';
import { PLAYER_CONFIG } from '../config/PlayerConfig';
import { EnemyTypes, EnemyType } from '../config/Identifiers';

export class EntityFactory {
  
  public static createPlayer(): Entity {
    const e = Registry.createEntity();
    e.addTag(Tag.PLAYER);
    
    e.addComponent(new TransformComponent(0, 0, 0, 1));
    e.addComponent(new MotionComponent(0, 0, 0.9)); 
    e.addComponent(new HealthComponent(PLAYER_CONFIG.maxHealth));
    e.addComponent(new StateComponent('IDLE')); // Track status
    
    Registry.updateCache(e);
    return e;
  }

  public static createEnemy(type: EnemyType, x: number, y: number): Entity {
    const config = ENEMY_CONFIG[type];
    const e = Registry.createEntity();
    
    e.addTag(Tag.ENEMY);
    e.addTag(Tag.OBSTACLE);

    e.addComponent(new TransformComponent(x, y, 0, 1));
    e.addComponent(new IdentityComponent(type));
    e.addComponent(new MotionComponent(0, 0, 0, 0)); 
    e.addComponent(new HealthComponent(config.hp));
    
    // Default state for everyone is IDLE or ORBIT depending on logic
    e.addComponent(new StateComponent('SPAWN')); 
    
    if (config.damage) {
        e.addComponent(new CombatComponent(config.damage));
    }

    Registry.updateCache(e);
    return e;
  }

  public static createBullet(
    x: number, y: number, 
    vx: number, vy: number, 
    isEnemy: boolean, 
    life: number
  ): Entity {
    const e = Registry.createEntity();
    e.addTag(Tag.BULLET);
    if (isEnemy) e.addTag(Tag.ENEMY); 
    else e.addTag(Tag.PLAYER); 

    e.addComponent(new TransformComponent(x, y, Math.atan2(vy, vx), 1));
    e.addComponent(new MotionComponent(vx, vy, 0));
    e.addComponent(new LifetimeComponent(life, life));
    e.addComponent(new CombatComponent(1)); 

    Registry.updateCache(e);
    return e;
  }

  public static createParticle(
    x: number, y: number, 
    color: string, 
    vx: number, vy: number, 
    life: number
  ): Entity {
    const e = Registry.createEntity();
    e.addTag(Tag.PARTICLE);

    e.addComponent(new TransformComponent(x, y, 0, 1));
    e.addComponent(new MotionComponent(vx, vy, 0.05));
    e.addComponent(new LifetimeComponent(life, life));
    e.addComponent(new IdentityComponent(color));

    Registry.updateCache(e);
    return e;
  }
}
