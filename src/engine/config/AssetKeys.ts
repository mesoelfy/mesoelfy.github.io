import { AUDIO_CONFIG } from './AudioConfig';
import { VFX_RECIPES } from './VFXConfig';

// 1. AUDIO KEYS (Derived from Config)
export type AudioKey = keyof typeof AUDIO_CONFIG;

// 2. VFX KEYS (Derived from Config)
export type VFXKey = keyof typeof VFX_RECIPES;

// 3. GEOMETRY KEYS (Manually Synced with AssetCatalog)
export type GeometryKey = 
  | 'GEO_DRILLER' 
  | 'GEO_KAMIKAZE' 
  | 'GEO_HUNTER' 
  | 'GEO_DAEMON'
  | 'GEO_PARTICLE' 
  | 'GEO_BULLET' 
  | 'PLAYER_GEO' 
  | 'DEFAULT_GEO';

// 4. MATERIAL KEYS (Manually Synced with AssetCatalog)
export type MaterialKey = 
  | 'MAT_ENEMY_BASE' 
  | 'MAT_PARTICLE' 
  | 'PLAYER_MAT' 
  | 'MAT_GLITCH'
  | 'MAT_PLAYER_AMBIENT' 
  | 'MAT_PLAYER_BACKING'
  | 'MAT_GALLERY_BODY'
  | 'DEFAULT_MAT';
