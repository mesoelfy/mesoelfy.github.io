import { WeaponDef } from './types';
import { Tag } from '@/engine/ecs/types';
import { PALETTE } from '@/engine/config/Palette';

export const WEAPONS: Record<string, WeaponDef> = {
  // --- PLAYER WEAPONS ---
  'PLAYER_STANDARD': {
    id: 'PLAYER_STANDARD',
    damage: 1, speed: 45, life: 1.5,
    visual: { model: 'CAPSULE', color: PALETTE.GREEN.PRIMARY, scale: [0.15, 0.6, 0.15], material: 'PROJECTILE' },
    behavior: { faceVelocity: true },
    tags: [Tag.BULLET, Tag.PLAYER]
  },
  'PLAYER_FORK': {
    id: 'PLAYER_FORK',
    damage: 1, speed: 45, life: 1.5,
    visual: { model: 'TETRA', color: PALETTE.YELLOW.SOFT, scale: [0.4, 0.4, 0.4], material: 'PROJECTILE' },
    behavior: { faceVelocity: true, spinSpeed: 5.0 },
    tags: [Tag.BULLET, Tag.PLAYER]
  },
  'PLAYER_SNIFFER': {
    id: 'PLAYER_SNIFFER',
    damage: 0.5, speed: 22, life: 3.0,
    visual: { model: 'OCTA', color: PALETTE.CYAN.PRIMARY, scale: [0.3, 0.3, 0.3], material: 'PROJECTILE', radius: 1.0 },
    behavior: { faceVelocity: false, spinSpeed: 15.0, homing: true },
    tags: [Tag.BULLET, Tag.PLAYER]
  },
  'PLAYER_BACKDOOR': {
    id: 'PLAYER_BACKDOOR',
    damage: 1, speed: 45, life: 1.5,
    visual: { model: 'TORUS', color: PALETTE.RED.LIGHT, scale: [0.4, 0.4, 0.4], material: 'PROJECTILE' },
    behavior: { faceVelocity: false, spinSpeed: -2.0, pulseSpeed: 2.0 },
    tags: [Tag.BULLET, Tag.PLAYER]
  },
  'PLAYER_PURGE': {
    id: 'PLAYER_PURGE',
    damage: 50, speed: 24, life: 2.4,
    visual: { model: 'CUSTOM_CHEVRON', color: PALETTE.YELLOW.ORANGE, scale: [2.5, 0.7, 1.5], material: 'PROJECTILE' },
    behavior: { faceVelocity: true },
    tags: [Tag.BULLET, Tag.PLAYER]
  },

  // --- ENEMY WEAPONS ---
  'ENEMY_HUNTER': {
    id: 'ENEMY_HUNTER',
    damage: 10, speed: 25, life: 3.0,
    visual: { model: 'CONE', color: PALETTE.YELLOW.ORANGE, scale: [0.3, 1.0, 0.3], material: 'PROJECTILE' },
    behavior: { faceVelocity: true },
    tags: [Tag.BULLET, Tag.ENEMY]
  },
  'DAEMON_ORB': {
    id: 'DAEMON_ORB',
    damage: 20, speed: 35, life: 2.0,
    visual: { model: 'SPHERE', color: PALETTE.CYAN.DIM, scale: [0.5, 0.5, 0.5], material: 'PROJECTILE' },
    behavior: { faceVelocity: false, spinSpeed: 1.0, pulseSpeed: 4.0 },
    tags: [Tag.BULLET, Tag.PLAYER] 
  }
};
