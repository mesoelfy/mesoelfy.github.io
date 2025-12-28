import { WeaponDef } from './types';
import { Tag } from '@/engine/ecs/types';
import { PALETTE } from '@/engine/config/Palette';
import { WeaponIDs } from '@/engine/config/Identifiers';

export const WEAPONS: Record<string, WeaponDef> = {
  // --- PLAYER: RAILGUN (New Default) ---
  [WeaponIDs.PLAYER_RAILGUN]: {
    id: WeaponIDs.PLAYER_RAILGUN,
    damage: 1, 
    speed: 50, 
    life: 1.5,
    visual: { model: 'CRESCENT', color: PALETTE.PURPLE.PRIMARY, scale: [0.3, 0.3, 0.3], material: 'PROJECTILE' },
    behavior: { faceVelocity: true },
    tags: [Tag.PROJECTILE, Tag.PLAYER]
  },

  // --- PLAYER: SNIFFER (Auxiliary) ---
  [WeaponIDs.PLAYER_SNIFFER]: {
    id: WeaponIDs.PLAYER_SNIFFER,
    damage: 1, 
    speed: 22, 
    life: 3.0,
    visual: { model: 'OCTA', color: PALETTE.PURPLE.LIGHT, scale: [0.33, 0.33, 0.33], material: 'PROJECTILE', radius: 1.0 },
    behavior: { faceVelocity: false, spinSpeed: 15.0, homing: true },
    tags: [Tag.PROJECTILE, Tag.PLAYER]
  },

  // --- PLAYER: PURGE (Zen Bomb) ---
  [WeaponIDs.PLAYER_PURGE]: {
    id: WeaponIDs.PLAYER_PURGE,
    damage: 50, speed: 24, life: 2.4,
    visual: { model: 'CUSTOM_CHEVRON', color: PALETTE.ORANGE.BRIGHT, scale: [2.5, 0.7, 1.5], material: 'PROJECTILE' },
    behavior: { faceVelocity: true },
    tags: [Tag.PROJECTILE, Tag.PLAYER]
  },

  // --- ENEMY WEAPONS ---
  [WeaponIDs.ENEMY_HUNTER]: {
    id: WeaponIDs.ENEMY_HUNTER,
    damage: 10, speed: 25, life: 3.0,
    visual: { model: 'CONE', color: PALETTE.ORANGE.PRIMARY, scale: [0.3, 1.0, 0.3], material: 'PROJECTILE' },
    behavior: { faceVelocity: true },
    tags: [Tag.PROJECTILE, Tag.ENEMY]
  },
  [WeaponIDs.DAEMON_ORB]: {
    id: WeaponIDs.DAEMON_ORB,
    damage: 20, speed: 35, life: 2.0,
    visual: { model: 'SPHERE', color: PALETTE.PINK.DIM, scale: [0.5, 0.5, 0.5], material: 'PROJECTILE' },
    behavior: { faceVelocity: false, spinSpeed: 1.0, pulseSpeed: 4.0 },
    tags: [Tag.PROJECTILE, Tag.PLAYER] 
  }
};
