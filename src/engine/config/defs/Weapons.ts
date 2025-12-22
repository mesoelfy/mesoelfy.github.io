import { WeaponDef } from './types';
import { Tag } from '@/engine/ecs/types';
import { PALETTE } from '@/engine/config/Palette';
import { WeaponIDs } from '@/engine/config/Identifiers';

export const WEAPONS: Record<WeaponID, WeaponDef> = {
  // --- PLAYER WEAPONS ---
  [WeaponIDs.PLAYER_STANDARD]: {
    id: WeaponIDs.PLAYER_STANDARD,
    damage: 1, speed: 45, life: 1.5,
    visual: { model: 'CAPSULE', color: PALETTE.GREEN.PRIMARY, scale: [0.15, 0.6, 0.15], material: 'PROJECTILE' },
    behavior: { faceVelocity: true },
    tags: [Tag.BULLET, Tag.PLAYER]
  },
  [WeaponIDs.PLAYER_FORK]: {
    id: WeaponIDs.PLAYER_FORK,
    damage: 1, speed: 45, life: 1.5,
    visual: { model: 'TETRA', color: PALETTE.YELLOW.SOFT, scale: [0.4, 0.4, 0.4], material: 'PROJECTILE' },
    behavior: { faceVelocity: true, spinSpeed: 5.0 },
    tags: [Tag.BULLET, Tag.PLAYER]
  },
  [WeaponIDs.PLAYER_SNIFFER]: {
    id: WeaponIDs.PLAYER_SNIFFER,
    damage: 0.5, speed: 22, life: 3.0,
    visual: { model: 'OCTA', color: PALETTE.PINK.PRIMARY, scale: [0.3, 0.3, 0.3], material: 'PROJECTILE', radius: 1.0 },
    behavior: { faceVelocity: false, spinSpeed: 15.0, homing: true },
    tags: [Tag.BULLET, Tag.PLAYER]
  },
  [WeaponIDs.PLAYER_BACKDOOR]: {
    id: WeaponIDs.PLAYER_BACKDOOR,
    damage: 1, speed: 45, life: 1.5,
    visual: { model: 'TORUS', color: PALETTE.RED.LIGHT, scale: [0.4, 0.4, 0.4], material: 'PROJECTILE' },
    behavior: { faceVelocity: false, spinSpeed: -2.0, pulseSpeed: 2.0 },
    tags: [Tag.BULLET, Tag.PLAYER]
  },
  [WeaponIDs.PLAYER_PURGE]: {
    id: WeaponIDs.PLAYER_PURGE,
    damage: 50, speed: 24, life: 2.4,
    visual: { model: 'CUSTOM_CHEVRON', color: PALETTE.ORANGE.BRIGHT, scale: [2.5, 0.7, 1.5], material: 'PROJECTILE' },
    behavior: { faceVelocity: true },
    tags: [Tag.BULLET, Tag.PLAYER]
  },

  // --- ENEMY WEAPONS ---
  [WeaponIDs.ENEMY_HUNTER]: {
    id: WeaponIDs.ENEMY_HUNTER,
    damage: 10, speed: 25, life: 3.0,
    visual: { model: 'CONE', color: PALETTE.ORANGE.PRIMARY, scale: [0.3, 1.0, 0.3], material: 'PROJECTILE' }, // Updated
    behavior: { faceVelocity: true },
    tags: [Tag.BULLET, Tag.ENEMY]
  },
  [WeaponIDs.DAEMON_ORB]: {
    id: WeaponIDs.DAEMON_ORB,
    damage: 20, speed: 35, life: 2.0,
    visual: { model: 'SPHERE', color: PALETTE.PINK.DIM, scale: [0.5, 0.5, 0.5], material: 'PROJECTILE' },
    behavior: { faceVelocity: false, spinSpeed: 1.0, pulseSpeed: 4.0 },
    tags: [Tag.BULLET, Tag.PLAYER] 
  }
};
