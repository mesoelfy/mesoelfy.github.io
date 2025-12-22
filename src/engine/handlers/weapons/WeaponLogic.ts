import { ConfigService } from '@/engine/services/ConfigService';
import { GAMEPLAY_CONFIG } from '@/engine/config/GameplayConfig';
import { GAME_MATH } from '@/engine/config/constants/MathConstants';
import { WeaponIDs, ArchetypeID } from '@/engine/config/Identifiers';

export interface ShotDef {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  life: number;
  configId: ArchetypeID;
  isHoming: boolean;
}

const MUZZLE_OFFSET = GAMEPLAY_CONFIG.WEAPON.MUZZLE_OFFSET;

// EXACT CALCULATION NOTE:
// The Reticle Geometry (createReticleGeo in PlayerActor) defines tips at:
// theta - tA. 
// tA (Tip Angle offset) is 0.55 radians.
// The static mesh rotation (PI/12) is OVERWRITTEN by the useFrame loop,
// so the net visual offset is exactly -0.55 radians.

const RETICLE_RADIUS = 1.65; // User preferred visual radius
const TWIST_OFFSET = -0.55;  // Exact geometry parameter 'tA' (negative for CW twist)

// Standard Cardinal Points (CCW from East/Right)
const ANGLES = {
    RIGHT: 0,
    TOP: Math.PI / 2,
    LEFT: Math.PI,
    BOTTOM: Math.PI * 1.5
};

// Map requested order to the geometry indices
// 1. Top Left (Tip 2):   LEFT + Twist
// 2. Bottom Right (Tip 0): RIGHT + Twist
// 3. Bottom Left (Tip 3): BOTTOM + Twist
// 4. Top Right (Tip 1):    TOP + Twist
const SNIFFER_TIPS = [
    ANGLES.LEFT + TWIST_OFFSET,   // 1. Top Left
    ANGLES.RIGHT + TWIST_OFFSET,  // 2. Bottom Right
    ANGLES.BOTTOM + TWIST_OFFSET, // 3. Bottom Left
    ANGLES.TOP + TWIST_OFFSET     // 4. Top Right
];

export const calculatePlayerShots = (
  origin: { x: number, y: number },
  target: { x: number, y: number },
  upgrades: Record<string, number>,
  reticleRotation: number = 0 // Passed from visual system
): ShotDef[] => {
  const shots: ShotDef[] = [];
  const config = ConfigService.player;

  const forkLevel = upgrades['FORK'] || 0;
  const dmgLevel = upgrades['EXECUTE'] || 0;
  const snifferLevel = upgrades['SNIFFER'] || 0;
  const backdoorLevel = upgrades['BACKDOOR'] || 0;

  const projectileCount = 1 + (forkLevel * 2);
  const damage = 1 + dmgLevel;
  const speed = config.bulletSpeed;
  const life = config.bulletLife;

  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const baseAngle = Math.atan2(dy, dx);

  let configId: ArchetypeID = WeaponIDs.PLAYER_STANDARD;
  if (forkLevel > 0) configId = WeaponIDs.PLAYER_FORK;
  
  const spreadAngle = GAME_MATH.WEAPON_SPREAD_BASE; 
  const startAngle = baseAngle - ((projectileCount - 1) * spreadAngle) / 2;

  // --- 1. STANDARD / FORK SHOTS (Main Gun) ---
  for (let i = 0; i < projectileCount; i++) {
      const angle = startAngle + (i * spreadAngle);
      
      const spawnX = origin.x + Math.cos(angle) * MUZZLE_OFFSET;
      const spawnY = origin.y + Math.sin(angle) * MUZZLE_OFFSET;

      shots.push({
          x: spawnX,
          y: spawnY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          damage,
          life,
          configId,
          isHoming: false
      });
  }

  // --- 2. BACKDOOR SHOTS (Rear Gun) ---
  if (backdoorLevel > 0) {
      const rearAngle = baseAngle + Math.PI; 
      
      const spawnX = origin.x + Math.cos(rearAngle) * MUZZLE_OFFSET;
      const spawnY = origin.y + Math.sin(rearAngle) * MUZZLE_OFFSET;

      shots.push({
          x: spawnX,
          y: spawnY,
          vx: Math.cos(rearAngle) * speed,
          vy: Math.sin(rearAngle) * speed,
          damage,
          life,
          configId: WeaponIDs.PLAYER_BACKDOOR,
          isHoming: false
      });
  }

  // --- 3. SNIFFER SHOTS (Reticle Tips) ---
  if (snifferLevel > 0) {
      // Clamp to max 4 tips
      const maxTips = 4;
      
      for (let i = 0; i < snifferLevel; i++) {
          const tipIndex = i % maxTips;
          
          // Calculate exact tip position relative to reticle rotation
          const localAngle = SNIFFER_TIPS[tipIndex];
          const globalAngle = reticleRotation + localAngle;
          
          const tipX = origin.x + Math.cos(globalAngle) * RETICLE_RADIUS;
          const tipY = origin.y + Math.sin(globalAngle) * RETICLE_RADIUS;
          
          // Velocity: They shoot outward from center, then home in
          const vx = Math.cos(globalAngle) * speed * 0.5;
          const vy = Math.sin(globalAngle) * speed * 0.5;
          
          shots.push({
              x: tipX,
              y: tipY,
              vx: vx,
              vy: vy,
              damage: damage * 0.5,
              life: life * 2,
              configId: WeaponIDs.PLAYER_SNIFFER,
              isHoming: true
          });
      }
  }

  return shots;
};
