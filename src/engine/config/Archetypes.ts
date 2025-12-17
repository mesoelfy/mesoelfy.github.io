import { PLAYER_CONFIG } from './PlayerConfig';
import { PhysicsConfig, CollisionLayers } from './PhysicsConfig';
import { ArchetypeIDs } from './Identifiers';
import { Tag } from '@/engine/ecs/types';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { GAME_THEME } from '@/ui/sim/config/theme';

const parseHex = (hex: string) => {
    const c = parseInt(hex.replace('#', ''), 16);
    return { 
        r: ((c >> 16) & 255) / 255, 
        g: ((c >> 8) & 255) / 255, 
        b: (c & 255) / 255 
    };
};

const DRILLER_COLOR = parseHex(GAME_THEME.enemy.muncher);
const KAMIKAZE_COLOR = parseHex(GAME_THEME.enemy.kamikaze);
const HUNTER_COLOR = parseHex(GAME_THEME.enemy.hunter);
const DAEMON_COLOR = parseHex('#00F0FF');
const PLAYER_COLOR = parseHex(GAME_THEME.turret.base);

export interface EntityBlueprint {
  tags: Tag[];
  components: { type: ComponentType; data?: any }[];
}

export const ARCHETYPES: Record<string, EntityBlueprint> = {
  [ArchetypeIDs.PLAYER]: {
    tags: [Tag.PLAYER],
    components: [
      { type: ComponentType.Identity, data: { variant: 'PLAYER' } },
      { type: ComponentType.Transform, data: { x: 0, y: 0, rotation: 0, scale: 1 } },
      { type: ComponentType.Motion, data: { friction: 0.9 } },
      { type: ComponentType.Health, data: { max: PLAYER_CONFIG.maxHealth } },
      { type: ComponentType.State, data: { current: 'IDLE' } },
      { type: ComponentType.Collider, data: { 
          radius: PhysicsConfig.HITBOX.PLAYER, 
          layer: CollisionLayers.PLAYER, 
          mask: PhysicsConfig.MASKS.PLAYER 
      }},
      { type: ComponentType.Render, data: { ...PLAYER_COLOR, visualScale: 1.0, geometryId: 'PLAYER_GEO', materialId: 'PLAYER_MAT' } }
    ]
  },
  [ArchetypeIDs.BULLET_PLAYER]: {
    tags: [Tag.BULLET, Tag.PLAYER],
    components: [
      { type: ComponentType.Transform, data: { scale: 1.0 } },
      { type: ComponentType.Motion, data: { friction: 0 } },
      { type: ComponentType.Lifetime, data: { remaining: 1.5, total: 1.5 } },
      { type: ComponentType.Combat, data: { damage: 1 } },
      { type: ComponentType.Health, data: { max: 1 } },
      { type: ComponentType.Collider, data: { 
          radius: PhysicsConfig.HITBOX.BULLET, 
          layer: CollisionLayers.PLAYER_PROJECTILE, 
          mask: PhysicsConfig.MASKS.PLAYER_PROJECTILE 
      }},
      { type: ComponentType.Render, data: { visualScale: 1.0 } },
      { type: ComponentType.Projectile, data: { configId: 'PLAYER_STANDARD', state: 'FLIGHT' } }
    ]
  },
  [ArchetypeIDs.BULLET_ENEMY]: {
    tags: [Tag.BULLET, Tag.ENEMY],
    components: [
      { type: ComponentType.Transform, data: { scale: 1.0 } },
      { type: ComponentType.Motion, data: { friction: 0 } },
      { type: ComponentType.Lifetime, data: { remaining: 3.0, total: 3.0 } },
      { type: ComponentType.Combat, data: { damage: 10 } },
      { type: ComponentType.Health, data: { max: 1 } },
      { type: ComponentType.Collider, data: { 
          radius: PhysicsConfig.HITBOX.HUNTER_BULLET, 
          layer: CollisionLayers.ENEMY_PROJECTILE, 
          mask: PhysicsConfig.MASKS.ENEMY_PROJECTILE 
      }},
      { type: ComponentType.Render, data: { visualScale: 1.0 } },
      { type: ComponentType.Projectile, data: { configId: 'ENEMY_HUNTER', state: 'FLIGHT' } }
    ]
  },
  [ArchetypeIDs.DRILLER]: {
    tags: [Tag.ENEMY, Tag.OBSTACLE],
    components: [
      { type: ComponentType.Identity, data: { variant: ArchetypeIDs.DRILLER } },
      { type: ComponentType.Transform, data: { scale: 1.0 } }, 
      { type: ComponentType.Health, data: { max: 1 } }, 
      { type: ComponentType.Motion, data: { friction: 0 } },
      { type: ComponentType.Combat, data: { damage: 1 } },
      { type: ComponentType.Collider, data: { radius: PhysicsConfig.HITBOX.DRILLER, layer: CollisionLayers.ENEMY, mask: PhysicsConfig.MASKS.ENEMY } },
      { type: ComponentType.State, data: { current: 'SPAWN', timers: { spawn: 1.5 } } },
      { type: ComponentType.Target, data: { type: 'PANEL' } },
      { type: ComponentType.Render, data: { ...DRILLER_COLOR, geometryId: 'GEO_DRILLER', materialId: 'MAT_ENEMY_BASE' } }
    ]
  },
  [ArchetypeIDs.KAMIKAZE]: {
    tags: [Tag.ENEMY, Tag.OBSTACLE],
    components: [
      { type: ComponentType.Identity, data: { variant: ArchetypeIDs.KAMIKAZE } },
      { type: ComponentType.Transform, data: { scale: 1.0 } }, 
      { type: ComponentType.Health, data: { max: 2 } }, 
      { type: ComponentType.Motion, data: { friction: 0 } },
      { type: ComponentType.Combat, data: { damage: 3 } },
      { type: ComponentType.Collider, data: { radius: PhysicsConfig.HITBOX.KAMIKAZE, layer: CollisionLayers.ENEMY, mask: PhysicsConfig.MASKS.ENEMY } },
      { type: ComponentType.State, data: { current: 'SPAWN', timers: { spawn: 1.5 } } },
      { type: ComponentType.Target, data: { type: 'PLAYER' } },
      { type: ComponentType.Render, data: { ...KAMIKAZE_COLOR, geometryId: 'GEO_KAMIKAZE', materialId: 'MAT_ENEMY_BASE' } }
    ]
  },
  [ArchetypeIDs.HUNTER]: {
    tags: [Tag.ENEMY, Tag.OBSTACLE],
    components: [
      { type: ComponentType.Identity, data: { variant: ArchetypeIDs.HUNTER } },
      { type: ComponentType.Transform, data: { scale: 1.0 } }, 
      { type: ComponentType.Health, data: { max: 3 } }, 
      { type: ComponentType.Motion, data: { friction: 0 } },
      { type: ComponentType.Combat, data: { damage: 10 } }, 
      { type: ComponentType.Collider, data: { radius: PhysicsConfig.HITBOX.HUNTER, layer: CollisionLayers.ENEMY, mask: PhysicsConfig.MASKS.ENEMY } },
      { type: ComponentType.State, data: { current: 'SPAWN', timers: { spawn: 1.5 } } },
      { type: ComponentType.Target, data: { type: 'PLAYER' } },
      { type: ComponentType.Render, data: { ...HUNTER_COLOR, geometryId: 'GEO_HUNTER', materialId: 'MAT_ENEMY_BASE' } }
    ]
  },
  [ArchetypeIDs.DAEMON]: {
    tags: [Tag.PLAYER],
    components: [
      { type: ComponentType.Identity, data: { variant: ArchetypeIDs.DAEMON } },
      { type: ComponentType.Transform, data: { scale: 1.0 } },
      { type: ComponentType.Health, data: { max: 100 } }, 
      { type: ComponentType.Orbital, data: { radius: 4.0, speed: 1.5, angle: 0 } },
      { type: ComponentType.Target, data: { type: 'ENEMY' } }, 
      { type: ComponentType.Collider, data: { radius: 0.6, layer: CollisionLayers.PLAYER, mask: PhysicsConfig.MASKS.PLAYER } },
      { type: ComponentType.State, data: { current: 'ORBIT' } },
      { type: ComponentType.Render, data: { ...DAEMON_COLOR, geometryId: 'GEO_DAEMON', materialId: 'MAT_ENEMY_BASE' } }
    ]
  }
};
