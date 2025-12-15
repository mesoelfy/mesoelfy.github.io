import { ENEMY_CONFIG } from './EnemyConfig';
import { PLAYER_CONFIG } from './PlayerConfig';
import { PhysicsConfig, CollisionLayers } from './PhysicsConfig';
import { ArchetypeIDs } from './Identifiers';
import { Tag } from '@/engine/ecs/types';

export interface EntityBlueprint {
  tags: Tag[];
  components: { type: string; data?: any }[];
}

export const ARCHETYPES: Record<string, EntityBlueprint> = {
  [ArchetypeIDs.PLAYER]: {
    tags: [Tag.PLAYER],
    components: [
      { type: 'Transform', data: { x: 0, y: 0, rotation: 0, scale: 1 } },
      { type: 'Motion', data: { friction: 0.9 } },
      { type: 'Health', data: { max: PLAYER_CONFIG.maxHealth } },
      { type: 'State', data: { current: 'IDLE' } },
      { type: 'Collider', data: { 
          radius: PhysicsConfig.HITBOX.PLAYER, 
          layer: CollisionLayers.PLAYER, 
          mask: PhysicsConfig.MASKS.PLAYER 
      }}
    ]
  },
  [ArchetypeIDs.BULLET_PLAYER]: {
    tags: [Tag.BULLET, Tag.PLAYER],
    components: [
      { type: 'Transform', data: { scale: 1.0 } },
      { type: 'Motion', data: { friction: 0 } },
      { type: 'Lifetime', data: { remaining: 1.5, total: 1.5 } },
      { type: 'Combat', data: { damage: 1 } },
      { type: 'Health', data: { max: 1 } },
      { type: 'Collider', data: { 
          radius: PhysicsConfig.HITBOX.BULLET, 
          layer: CollisionLayers.PLAYER_PROJECTILE, 
          mask: PhysicsConfig.MASKS.PLAYER_PROJECTILE 
      }}
    ]
  },
  [ArchetypeIDs.BULLET_ENEMY]: {
    tags: [Tag.BULLET, Tag.ENEMY],
    components: [
      { type: 'Transform', data: { scale: 1.0 } },
      { type: 'Motion', data: { friction: 0 } },
      { type: 'Lifetime', data: { remaining: 3.0, total: 3.0 } },
      { type: 'Combat', data: { damage: 10 } },
      { type: 'Health', data: { max: 1 } },
      { type: 'Collider', data: { 
          radius: PhysicsConfig.HITBOX.HUNTER_BULLET, 
          layer: CollisionLayers.ENEMY_PROJECTILE, 
          mask: PhysicsConfig.MASKS.ENEMY_PROJECTILE 
      }}
    ]
  },
  [ArchetypeIDs.DRILLER]: {
    tags: [Tag.ENEMY, Tag.OBSTACLE],
    components: [
      { type: 'Identity', data: { variant: ArchetypeIDs.DRILLER } },
      { type: 'Transform', data: { scale: 1.0 } }, 
      { type: 'Health', data: { max: ENEMY_CONFIG.driller.hp } },
      { type: 'Motion', data: { friction: 0 } },
      { type: 'Combat', data: { damage: ENEMY_CONFIG.driller.damage } },
      { type: 'Collider', data: { radius: PhysicsConfig.HITBOX.DRILLER, layer: CollisionLayers.ENEMY, mask: PhysicsConfig.MASKS.ENEMY } },
      { type: 'State', data: { current: 'SPAWN', timers: { spawn: 1.5 } } },
      { type: 'Target', data: { type: 'PANEL' } }
    ]
  },
  [ArchetypeIDs.KAMIKAZE]: {
    tags: [Tag.ENEMY, Tag.OBSTACLE],
    components: [
      { type: 'Identity', data: { variant: ArchetypeIDs.KAMIKAZE } },
      { type: 'Transform', data: { scale: 1.0 } }, 
      { type: 'Health', data: { max: ENEMY_CONFIG.kamikaze.hp } },
      { type: 'Motion', data: { friction: 0 } },
      { type: 'Combat', data: { damage: ENEMY_CONFIG.kamikaze.damage } },
      { type: 'Collider', data: { radius: PhysicsConfig.HITBOX.KAMIKAZE, layer: CollisionLayers.ENEMY, mask: PhysicsConfig.MASKS.ENEMY } },
      { type: 'State', data: { current: 'SPAWN', timers: { spawn: 1.5 } } },
      { type: 'Target', data: { type: 'PLAYER' } }
    ]
  },
  [ArchetypeIDs.HUNTER]: {
    tags: [Tag.ENEMY, Tag.OBSTACLE],
    components: [
      { type: 'Identity', data: { variant: ArchetypeIDs.HUNTER } },
      { type: 'Transform', data: { scale: 1.0 } }, 
      { type: 'Health', data: { max: ENEMY_CONFIG.hunter.hp } },
      { type: 'Motion', data: { friction: 0 } },
      { type: 'Combat', data: { damage: 10 } }, 
      { type: 'Collider', data: { radius: PhysicsConfig.HITBOX.HUNTER, layer: CollisionLayers.ENEMY, mask: PhysicsConfig.MASKS.ENEMY } },
      { type: 'State', data: { current: 'SPAWN', timers: { spawn: 1.5 } } },
      { type: 'Target', data: { type: 'PLAYER' } }
    ]
  },
  [ArchetypeIDs.DAEMON]: {
    tags: [Tag.PLAYER],
    components: [
      { type: 'Identity', data: { variant: ArchetypeIDs.DAEMON } },
      { type: 'Transform', data: { scale: 1.0 } },
      { type: 'Health', data: { max: 100 } }, 
      { type: 'Orbital', data: { radius: 4.0, speed: 1.5, angle: 0 } },
      { type: 'Target', data: { type: 'ENEMY' } }, 
      { type: 'Collider', data: { radius: 0.6, layer: CollisionLayers.PLAYER, mask: PhysicsConfig.MASKS.PLAYER } },
      { type: 'State', data: { current: 'ORBIT' } }
    ]
  }
};
