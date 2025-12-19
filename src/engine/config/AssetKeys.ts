import { AUDIO_MANIFEST } from './assets/AudioManifest';
import { VFX_MANIFEST } from './assets/VFXManifest';

export type AudioKey = keyof typeof AUDIO_MANIFEST;
export type VFXKey = keyof typeof VFX_MANIFEST;

export type GeometryKey = 
  | 'GEO_DRILLER' 
  | 'GEO_KAMIKAZE' 
  | 'GEO_HUNTER' 
  | 'GEO_DAEMON'
  | 'GEO_PARTICLE' 
  | 'GEO_BULLET' 
  | 'PLAYER_GEO' 
  | 'GEO_PRJ_SPHERE'
  | 'GEO_PRJ_CAPSULE'
  | 'GEO_PRJ_DIAMOND'
  | 'GEO_PRJ_PYRAMID'
  | 'GEO_PRJ_RING'
  | 'GEO_PRJ_ARROW'
  | 'DEFAULT_GEO';

export type MaterialKey = 
  | 'MAT_ENEMY_BASE' 
  | 'MAT_PARTICLE' 
  | 'PLAYER_MAT' 
  | 'MAT_GLITCH'
  | 'MAT_PLAYER_AMBIENT' 
  | 'MAT_PLAYER_BACKING'
  | 'MAT_GALLERY_BODY'
  | 'MAT_PROJECTILE'
  | 'DEFAULT_MAT';
