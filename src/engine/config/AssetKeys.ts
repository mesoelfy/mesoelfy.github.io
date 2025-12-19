import { AUDIO_MANIFEST } from './assets/AudioManifest';
import { VFX_MANIFEST } from './assets/VFXManifest';

// --- GEOMETRY ---
export const GEOMETRY_IDS = {
  DRILLER: 'GEO_DRILLER',
  KAMIKAZE: 'GEO_KAMIKAZE',
  HUNTER: 'GEO_HUNTER',
  DAEMON: 'GEO_DAEMON',
  PARTICLE: 'GEO_PARTICLE',
  BULLET: 'GEO_BULLET',
  PLAYER: 'PLAYER_GEO',
  PRJ_SPHERE: 'GEO_PRJ_SPHERE',
  PRJ_CAPSULE: 'GEO_PRJ_CAPSULE',
  PRJ_DIAMOND: 'GEO_PRJ_DIAMOND',
  PRJ_PYRAMID: 'GEO_PRJ_PYRAMID',
  PRJ_RING: 'GEO_PRJ_RING',
  PRJ_ARROW: 'GEO_PRJ_ARROW',
  DEFAULT: 'DEFAULT_GEO'
} as const;

export type GeometryKey = typeof GEOMETRY_IDS[keyof typeof GEOMETRY_IDS];

// --- MATERIALS ---
export const MATERIAL_IDS = {
  ENEMY_BASE: 'MAT_ENEMY_BASE',
  PARTICLE: 'MAT_PARTICLE',
  PLAYER: 'PLAYER_MAT',
  GLITCH: 'MAT_GLITCH',
  PLAYER_AMBIENT: 'MAT_PLAYER_AMBIENT',
  PLAYER_BACKING: 'MAT_PLAYER_BACKING',
  GALLERY_BODY: 'MAT_GALLERY_BODY',
  PROJECTILE: 'MAT_PROJECTILE',
  DEFAULT: 'DEFAULT_MAT'
} as const;

export type MaterialKey = typeof MATERIAL_IDS[keyof typeof MATERIAL_IDS];

// --- AUDIO & VFX (Derived from Manifests for now, but typed) ---
export type AudioKey = keyof typeof AUDIO_MANIFEST;
export type VFXKey = keyof typeof VFX_MANIFEST;
