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

export const calculatePlayerShots = (
  origin: { x: number, y: number },
  target: { x: number, y: number },
  upgrades: Record<string, number>,
  reticleRotation: number = 0,
  fireCycle: number = 0
): ShotDef[] => {
  const shots: ShotDef[] = [];
  const config = ConfigService.player;

  const forkLevel = upgrades['FORK'] || 0;
  const dmgLevel = upgrades['EXECUTE'] || 0;
  const snifferLevel = upgrades['SNIFFER'] || 0;
  const backdoorLevel = upgrades['BACKDOOR'] || 0;

  // UPDATED: Increase by 1 projectile per level (1, 2, 3, 4...)
  const projectileCount = 1 + forkLevel;
  
  const damage = 1 + dmgLevel;
  const speed = config.bulletSpeed;
  const life = config.bulletLife;

  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const baseAngle = Math.atan2(dy, dx);

  const configId: ArchetypeID = WeaponIDs.PLAYER_STANDARD;
  
  const spreadAngle = GAME_MATH.WEAPON_SPREAD_BASE; 
  const startAngle = baseAngle - ((projectileCount - 1) * spreadAngle) / 2;

  // --- 1. STANDARD / FORK SHOTS ---
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

  // --- 2. BACKDOOR SHOTS ---
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

  // --- 3. SNIFFER SHOTS ---
  // UPDATED: Only fire every 3rd cycle
  if (snifferLevel > 0 && fireCycle % 3 === 0) {
      const maxTips = 4;
      for (let i = 0; i < snifferLevel; i++) {
          const tipIndex = i % maxTips;
          const localAngle = SNIFFER_TIPS[tipIndex];
          const globalAngle = reticleRotation + localAngle;
          
          const tipX = origin.x + Math.cos(globalAngle) * RETICLE_RADIUS;
          const tipY = origin.y + Math.sin(globalAngle) * RETICLE_RADIUS;
          const vx = Math.cos(globalAngle) * speed * 0.5;
          const vy = Math.sin(globalAngle) * speed * 0.5;
          
          shots.push({
              x: tipX, y: tipY, vx, vy,
              // UPDATED: Base Damage + 1
              damage: damage + 1, 
              life: life * 2,
              configId: WeaponIDs.PLAYER_SNIFFER, 
              isHoming: true
          });
      }
  }

  return shots;
};
