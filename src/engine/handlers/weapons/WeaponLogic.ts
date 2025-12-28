import { ConfigService } from '@/engine/services/ConfigService';
import { GAMEPLAY_CONFIG } from '@/engine/config/GameplayConfig';
import { WeaponIDs, ArchetypeID } from '@/engine/config/Identifiers';
import { RailgunState, SnifferState } from '@/engine/types/game.types';

export interface ShotDef {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  life: number;
  configId: ArchetypeID;
  isHoming: boolean;
  scaleX?: number; // Visual Length (Forward axis)
  scaleY?: number; // Visual Width (Side axis)
}

const MUZZLE_OFFSET = GAMEPLAY_CONFIG.WEAPON.MUZZLE_OFFSET;
const RETICLE_RADIUS = 1.65; 
const TWIST_OFFSET = -0.55;  

const SNIFFER_TIPS = [
    Math.PI + TWIST_OFFSET,           // Left
    0 + TWIST_OFFSET,                 // Right
    Math.PI * 1.5 + TWIST_OFFSET,     // Bottom
    Math.PI / 2 + TWIST_OFFSET        // Top
];

export const calculateRailgunShot = (
  origin: { x: number, y: number },
  target: { x: number, y: number },
  state: RailgunState
): ShotDef => {
  const config = ConfigService.player;
  const damage = 1 + state.damageLevel;
  const speed = config.bulletSpeed; 
  const life = config.bulletLife;

  // --- WIDTH LOGIC ---
  // The Crescent geometry faces +X. 
  // Scale X = Length. Scale Y = Width.
  
  // Base scales (Visual units)
  const BASE_LEN = 0.4;
  const BASE_WID = 0.3;

  // Level 0: 1.0x width
  // Level 10: 8.0x width (Massive crescent expansion)
  const widthMult = 1.0 + (state.widthLevel * 0.7); 
  
  // Length stays relatively compact to look like a "wave" front
  const lengthMult = 1.0; 

  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const angle = Math.atan2(dy, dx);

  const spawnX = origin.x + Math.cos(angle) * MUZZLE_OFFSET;
  const spawnY = origin.y + Math.sin(angle) * MUZZLE_OFFSET;

  return {
      x: spawnX,
      y: spawnY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage,
      life,
      configId: WeaponIDs.PLAYER_RAILGUN,
      isHoming: false,
      scaleX: BASE_LEN * lengthMult, 
      scaleY: BASE_WID * widthMult   
  };
};

export const calculateSnifferShots = (
  origin: { x: number, y: number },
  state: SnifferState,
  reticleRotation: number
): ShotDef[] => {
  const shots: ShotDef[] = [];
  const activeCount = state.capacityLevel; 
  if (activeCount <= 0) return [];

  const damage = 1 + state.damageLevel;
  const speed = 22;
  const life = 3.0;

  for (let i = 0; i < activeCount; i++) {
      const localAngle = SNIFFER_TIPS[i % 4];
      const globalAngle = reticleRotation + localAngle;
      const tipX = origin.x + Math.cos(globalAngle) * RETICLE_RADIUS;
      const tipY = origin.y + Math.sin(globalAngle) * RETICLE_RADIUS;
      const vx = Math.cos(globalAngle) * speed * 0.5;
      const vy = Math.sin(globalAngle) * speed * 0.5;
      
      shots.push({
          x: tipX, y: tipY, vx, vy,
          damage, life, configId: WeaponIDs.PLAYER_SNIFFER, isHoming: true
      });
  }
  return shots;
};
