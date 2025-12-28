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
  scaleX?: number; // Visual Width Multiplier
}

const MUZZLE_OFFSET = GAMEPLAY_CONFIG.WEAPON.MUZZLE_OFFSET;
const RETICLE_RADIUS = 1.65; 
const TWIST_OFFSET = -0.55;  

const ANGLES = {
    RIGHT: 0,
    TOP: Math.PI / 2,
    LEFT: Math.PI,
    BOTTOM: Math.PI * 1.5
};

const SNIFFER_TIPS = [
    ANGLES.LEFT + TWIST_OFFSET,   
    ANGLES.RIGHT + TWIST_OFFSET,  
    ANGLES.BOTTOM + TWIST_OFFSET, 
    ANGLES.TOP + TWIST_OFFSET     
];

// --- RAILGUN LOGIC ---
export const calculateRailgunShot = (
  origin: { x: number, y: number },
  target: { x: number, y: number },
  state: RailgunState
): ShotDef => {
  const config = ConfigService.player;
  
  // Stats
  const damage = 1 + state.damageLevel;
  const speed = config.bulletSpeed; // 50
  const life = config.bulletLife;   // 1.5

  // Width Calculation: 
  // Level 0 = 0.2 (Base from Weapon Def)
  // Level 10 = 1.2 (Thick Beam)
  // Increment = 0.1 per level
  const baseWidth = 0.2;
  const widthScale = baseWidth + (state.widthLevel * 0.1);

  // Aim
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
      scaleX: widthScale
  };
};

// --- SNIFFER LOGIC ---
export const calculateSnifferShots = (
  origin: { x: number, y: number },
  state: SnifferState,
  reticleRotation: number
): ShotDef[] => {
  const shots: ShotDef[] = [];
  const config = ConfigService.player;

  // Capacity determines how many corners fire (1 to 4)
  // Level 0 = 0 (Disabled) -> Handled in System
  // Level 1 = 1 corner
  // Level 4 = 4 corners
  const activeCount = state.capacityLevel; 
  if (activeCount <= 0) return [];

  const damage = 1 + state.damageLevel;
  const speed = 22;
  const life = 3.0;

  for (let i = 0; i < activeCount; i++) {
      // Use fixed tip indices to ensure upgrades "fill in" slots deterministically
      // Order: Left, Right, Bottom, Top (from existing SNIFFER_TIPS array order)
      // Or should we distribute them? 
      // "One gets filled with each upgrade" implies fixed slots.
      // Let's use i % 4 to map to the 4 corners.
      
      const localAngle = SNIFFER_TIPS[i % 4];
      const globalAngle = reticleRotation + localAngle;
      
      const tipX = origin.x + Math.cos(globalAngle) * RETICLE_RADIUS;
      const tipY = origin.y + Math.sin(globalAngle) * RETICLE_RADIUS;
      
      // Initial velocity moves outward from center, then homing takes over
      const vx = Math.cos(globalAngle) * speed * 0.5;
      const vy = Math.sin(globalAngle) * speed * 0.5;
      
      shots.push({
          x: tipX, y: tipY, vx, vy,
          damage,
          life,
          configId: WeaponIDs.PLAYER_SNIFFER, 
          isHoming: true
      });
  }

  return shots;
};
