import { WeaponDef } from '../defs/types';
import { Tag } from '@/engine/ecs/types';
import { PALETTE } from '@/engine/config/Palette';
import { WeaponIDs } from '@/engine/config/Identifiers';

export const LEGACY_WEAPONS: Record<string, WeaponDef> = {
  [WeaponIDs.PLAYER_STANDARD]: {
    id: WeaponIDs.PLAYER_STANDARD,
    damage: 1, speed: 45, life: 1.5,
    visual: { model: 'CAPSULE', color: PALETTE.GREEN.PRIMARY, scale: [0.15, 0.6, 0.15], material: 'PROJECTILE' },
    behavior: { faceVelocity: true },
    tags: [Tag.PROJECTILE, Tag.PLAYER]
  },
  [WeaponIDs.PLAYER_FORK]: {
    id: WeaponIDs.PLAYER_FORK,
    damage: 1, speed: 45, life: 1.5,
    visual: { model: 'TETRA', color: PALETTE.YELLOW.SOFT, scale: [0.4, 0.4, 0.4], material: 'PROJECTILE' },
    behavior: { faceVelocity: true, spinSpeed: 5.0 },
    tags: [Tag.PROJECTILE, Tag.PLAYER]
  },
  [WeaponIDs.PLAYER_BACKDOOR]: {
    id: WeaponIDs.PLAYER_BACKDOOR,
    damage: 1, speed: 45, life: 1.5,
    visual: { model: 'TORUS', color: PALETTE.RED.LIGHT, scale: [0.4, 0.4, 0.4], material: 'PROJECTILE' },
    behavior: { faceVelocity: false, spinSpeed: -2.0, pulseSpeed: 2.0 },
    tags: [Tag.PROJECTILE, Tag.PLAYER]
  }
};
