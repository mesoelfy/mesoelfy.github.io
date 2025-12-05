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

// Configs
import { ENEMY_CONFIG } from '../config/EnemyConfig';
import { PLAYER_CONFIG } from '../config/PlayerConfig';
import { EnemyTypes, EnemyType } from '../config/Identifiers';

export class EntityFactory {
  
  public static createPlayer(): Entity {
    const e = Registry.createEntity();
    e.addTag(Tag.PLAYER);
    
    e.addComponent(new TransformComponent(0, 0, 0, 1));
    // Player motion is handled via input/velocity, but we add component for consistency
    e.addComponent(new MotionComponent(0, 0, 0.9)); 
    e.addComponent(new HealthComponent(PLAYER_CONFIG.maxHealth));
    
    Registry.updateCache(e);
    return e;
  }

  public static createEnemy(type: EnemyType, x: number, y: number): Entity {
    const config = ENEMY_CONFIG[type];
    const e = Registry.createEntity();
    
    e.addTag(Tag.ENEMY);
    e.addTag(Tag.OBSTACLE); // Can interact with other things?

    e.addComponent(new TransformComponent(x, y, 0, 1));
    e.addComponent(new IdentityComponent(type));
    
    // Motion: Default values, will be driven by AI
    e.addComponent(new MotionComponent(0, 0, 0, 0)); 
    
    e.addComponent(new HealthComponent(config.hp));
    
    // Combat: Damage on touch
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
    
    // Tag distinction for collision logic
    if (isEnemy) e.addTag(Tag.ENEMY); // It harms player
    else e.addTag(Tag.PLAYER); // It harms enemies

    e.addComponent(new TransformComponent(x, y, Math.atan2(vy, vx), 1));
    e.addComponent(new MotionComponent(vx, vy, 0)); // No friction
    e.addComponent(new LifetimeComponent(life, life));
    
    // Bullet Damage (could be dynamic based on player stats)
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
    e.addComponent(new MotionComponent(vx, vy, 0.05)); // Slight friction?
    e.addComponent(new LifetimeComponent(life, life));
    
    // Particles often need a generic "Data" component for color, 
    // or we can reuse Identity for visual variants.
    // For now, let's treat Identity variant as the Color hex code for simplicity
    e.addComponent(new IdentityComponent(color));

    Registry.updateCache(e);
    return e;
  }
}
