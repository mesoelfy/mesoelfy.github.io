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
  scaleX?: number;
  scaleY?: number;
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

  // --- RAILGUN SCALING (CORRECTED) ---
  // Model is Y-Up.
  // Scale X = Width (Side-to-Side)
  // Scale Y = Length (Forward)
  
  const BASE_WIDTH = 0.6; 
  const MAX_WIDTH = 2.5; 
  
  // Linear interpolation based on level (0-10)
  const widthMult = BASE_WIDTH + ((MAX_WIDTH - BASE_WIDTH) * (state.widthLevel / 10));
  
  const lengthMult = 0.6; // Constant thickness

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
      scaleX: widthMult,  // Width maps to X
      scaleY: lengthMult  // Length maps to Y
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
