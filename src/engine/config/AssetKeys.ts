import { AUDIO_MANIFEST } from './assets/AudioManifest';
import { VFX_MANIFEST } from './assets/VFXManifest';

// --- GEOMETRY ---
export const GEOMETRY_IDS = {
  // Actors
  PLAYER: 'PLAYER_GEO',
  PARTICLE: 'GEO_PARTICLE',
  
  // Enemies (Dynamic keys used in code: GEO_DRILLER, etc.)
  DRILLER: 'GEO_DRILLER',
  KAMIKAZE: 'GEO_KAMIKAZE',
  HUNTER: 'GEO_HUNTER',
  DAEMON: 'GEO_DAEMON',
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
  // Specific Projectile Materials
  PROJECTILE_PLAYER: 'MAT_PROJECTILE_PLAYER',
  PROJECTILE_ENEMY: 'MAT_PROJECTILE_ENEMY',
  PROJECTILE_HUNTER: 'MAT_PROJECTILE_HUNTER' // NEW: Bespoke Energy Shader
} as const;

export type MaterialKey = typeof MATERIAL_IDS[keyof typeof MATERIAL_IDS];

export type AudioKey = keyof typeof AUDIO_MANIFEST;
export type VFXKey = keyof typeof VFX_MANIFEST;
