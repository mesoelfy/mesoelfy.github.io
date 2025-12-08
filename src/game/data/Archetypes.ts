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
      { type: 'Collider', data: { radius: PhysicsConfig.HITBOX.DRILLER, layer: CollisionLayers.ENEMY, mask: PhysicsConfig.MASKS.ENEMY } },
      { type: 'State', data: { current: 'SPAWN', timers: { spawn: 1.5 } } },
      { type: 'Target', data: { type: 'PANEL' } }
    ]
  },
  [EnemyTypes.KAMIKAZE]: {
    tags: [Tag.ENEMY, Tag.OBSTACLE],
    components: [
      { type: 'Identity', data: { variant: EnemyTypes.KAMIKAZE } },
      { type: 'Health', data: { max: ENEMY_CONFIG.kamikaze.hp } },
      { type: 'Motion', data: { friction: 0 } },
      { type: 'Combat', data: { damage: ENEMY_CONFIG.kamikaze.damage } },
      { type: 'Collider', data: { radius: PhysicsConfig.HITBOX.KAMIKAZE, layer: CollisionLayers.ENEMY, mask: PhysicsConfig.MASKS.ENEMY } },
      { type: 'State', data: { current: 'SPAWN', timers: { spawn: 1.5 } } },
      { type: 'Target', data: { type: 'PLAYER' } }
    ]
  },
  [EnemyTypes.HUNTER]: {
    tags: [Tag.ENEMY, Tag.OBSTACLE],
    components: [
      { type: 'Identity', data: { variant: EnemyTypes.HUNTER } },
      { type: 'Health', data: { max: ENEMY_CONFIG.hunter.hp } },
      { type: 'Motion', data: { friction: 0 } },
      { type: 'Combat', data: { damage: 10 } }, 
      { type: 'Collider', data: { radius: PhysicsConfig.HITBOX.HUNTER, layer: CollisionLayers.ENEMY, mask: PhysicsConfig.MASKS.ENEMY } },
      { type: 'State', data: { current: 'SPAWN', timers: { spawn: 1.5 } } },
      { type: 'Target', data: { type: 'PLAYER' } }
    ]
  },
  // NEW: DAEMON
  [EnemyTypes.DAEMON]: {
    tags: [Tag.PLAYER], // Friendly
    components: [
      { type: 'Identity', data: { variant: EnemyTypes.DAEMON } },
      { type: 'Health', data: { max: 100 } }, // High HP Shield
      { type: 'Orbital', data: { radius: 4.0, speed: 1.5, angle: 0 } },
      { type: 'Transform', data: { scale: 1.0 } },
      { type: 'Target', data: { type: 'ENEMY' } }, // Seeks Enemies
      // Physics: Layer PLAYER means Enemies hit it and take damage/die (Ramming)
      { type: 'Collider', data: { radius: 0.6, layer: CollisionLayers.PLAYER, mask: PhysicsConfig.MASKS.PLAYER } },
      { type: 'State', data: { current: 'ORBIT' } }
    ]
  }
};
