import { ENEMY_CONFIG } from '../config/EnemyConfig';
import { PhysicsConfig, CollisionLayers } from '../config/PhysicsConfig';
import { EnemyTypes } from '../config/Identifiers';
import { Tag } from '../core/ecs/types';

export interface EntityBlueprint {
  tags: Tag[];
  components: { type: string; data?: any }[];
}

export const ARCHETYPES: Record<string, EntityBlueprint> = {
  [EnemyTypes.DRILLER]: {
    tags: [Tag.ENEMY, Tag.OBSTACLE],
    components: [
      { type: 'Identity', data: { variant: EnemyTypes.DRILLER } },
      { type: 'Health', data: { max: ENEMY_CONFIG.driller.hp } },
      { type: 'Motion', data: { friction: 0 } },
      { type: 'Combat', data: { damage: ENEMY_CONFIG.driller.damage } },
      { 
        type: 'Collider', 
        data: { 
          radius: PhysicsConfig.HITBOX.DRILLER, 
          layer: CollisionLayers.ENEMY, 
          mask: PhysicsConfig.MASKS.ENEMY 
        } 
      },
      { type: 'State', data: { current: 'SPAWN', timers: { spawn: 1.5 } } }
    ]
  },

  [EnemyTypes.KAMIKAZE]: {
    tags: [Tag.ENEMY, Tag.OBSTACLE],
    components: [
      { type: 'Identity', data: { variant: EnemyTypes.KAMIKAZE } },
      { type: 'Health', data: { max: ENEMY_CONFIG.kamikaze.hp } },
      { type: 'Motion', data: { friction: 0 } },
      { type: 'Combat', data: { damage: ENEMY_CONFIG.kamikaze.damage } },
      { 
        type: 'Collider', 
        data: { 
          radius: PhysicsConfig.HITBOX.KAMIKAZE, 
          layer: CollisionLayers.ENEMY, 
          mask: PhysicsConfig.MASKS.ENEMY 
        } 
      },
      { type: 'State', data: { current: 'SPAWN', timers: { spawn: 1.5 } } }
    ]
  },

  [EnemyTypes.HUNTER]: {
    tags: [Tag.ENEMY, Tag.OBSTACLE],
    components: [
      { type: 'Identity', data: { variant: EnemyTypes.HUNTER } },
      { type: 'Health', data: { max: ENEMY_CONFIG.hunter.hp } },
      { type: 'Motion', data: { friction: 0 } },
      { type: 'Combat', data: { damage: 10 } }, 
      { 
        type: 'Collider', 
        data: { 
          radius: PhysicsConfig.HITBOX.HUNTER, 
          layer: CollisionLayers.ENEMY, 
          mask: PhysicsConfig.MASKS.ENEMY 
        } 
      },
      { type: 'State', data: { current: 'SPAWN', timers: { spawn: 1.5 } } }
    ]
  }
};
