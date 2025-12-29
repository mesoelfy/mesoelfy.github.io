import { WeaponDef } from './types';
import { Tag } from '@/engine/ecs/types';
import { PALETTE } from '@/engine/config/Palette';
import { WeaponIDs } from '@/engine/config/Identifiers';

const DOT_SCALE: [number, number, number] = [0.4, 0.4, 0.4];

export const WEAPONS: Record<string, WeaponDef> = {
  [WeaponIDs.PLAYER_SPITTER]: {
    id: WeaponIDs.PLAYER_SPITTER,
    damage: 1, speed: 50, life: 1.5,
    visual: { model: 'SPHERE', color: PALETTE.PURPLE.PRIMARY, scale: DOT_SCALE, material: 'PROJECTILE' },
    behavior: { faceVelocity: false },
    tags: [Tag.PROJECTILE, Tag.PLAYER]
  },
  [WeaponIDs.PLAYER_SNIFFER]: {
    id: WeaponIDs.PLAYER_SNIFFER,
    damage: 1, speed: 22, life: 3.0,
    visual: { model: 'SPHERE', color: PALETTE.PURPLE.LIGHT, scale: DOT_SCALE, material: 'PROJECTILE' },
    behavior: { faceVelocity: false, homing: true },
    tags: [Tag.PROJECTILE, Tag.PLAYER]
  },
  [WeaponIDs.PLAYER_PURGE]: {
    id: WeaponIDs.PLAYER_PURGE,
    damage: 50, speed: 24, life: 2.4,
    visual: { model: 'SPHERE', color: PALETTE.ORANGE.BRIGHT, scale: [0.8, 0.8, 0.8], material: 'PROJECTILE' },
    behavior: { faceVelocity: false },
    tags: [Tag.PROJECTILE, Tag.PLAYER]
  },
  [WeaponIDs.ENEMY_HUNTER]: {
    id: WeaponIDs.ENEMY_HUNTER,
    damage: 10, speed: 25, life: 3.0,
    visual: { model: 'SPHERE', color: PALETTE.ORANGE.PRIMARY, scale: DOT_SCALE, material: 'PROJECTILE' },
    behavior: { faceVelocity: false },
    tags: [Tag.PROJECTILE, Tag.ENEMY]
  },
  [WeaponIDs.DAEMON_ORB]: {
    id: WeaponIDs.DAEMON_ORB,
    damage: 20, speed: 35, life: 2.0,
    visual: { model: 'SPHERE', color: PALETTE.PINK.DIM, scale: [0.5, 0.5, 0.5], material: 'PROJECTILE' },
    behavior: { faceVelocity: false },
    tags: [Tag.PROJECTILE, Tag.PLAYER] 
  }
};
