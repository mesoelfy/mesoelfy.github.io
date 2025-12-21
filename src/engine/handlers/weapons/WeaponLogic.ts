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

export const calculatePlayerShots = (
  origin: { x: number, y: number },
  target: { x: number, y: number },
  upgrades: Record<string, number>
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

  // Standard / Fork Shots
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

  // Backdoor Shots
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

  // Sniffer (Homing) Shots
  if (snifferLevel > 0) {
      const angleStep = GAME_MATH.FULL_CIRCLE / snifferLevel;
      for (let i = 0; i < snifferLevel; i++) {
          const angle = i * angleStep;
          
          const spawnX = origin.x + Math.cos(angle) * MUZZLE_OFFSET;
          const spawnY = origin.y + Math.sin(angle) * MUZZLE_OFFSET;
          
          shots.push({
              x: spawnX,
              y: spawnY,
              vx: Math.cos(angle) * speed * 0.5,
              vy: Math.sin(angle) * speed * 0.5,
              damage: damage * 0.5,
              life: life * 2,
              configId: WeaponIDs.PLAYER_SNIFFER,
              isHoming: true
          });
      }
  }

  return shots;
};
