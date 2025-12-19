import { Entity } from '@/engine/ecs/Entity';
import { ConfigService } from '@/engine/services/ConfigService';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { GAMEPLAY_CONFIG } from '@/engine/config/GameplayConfig';

export interface ShotDef {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  life: number;
  configId: string;
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

  // 1. Calculate Stats based on Upgrades
  const forkLevel = upgrades['FORK'] || 0;
  const dmgLevel = upgrades['EXECUTE'] || 0;
  const snifferLevel = upgrades['SNIFFER'] || 0;
  const backdoorLevel = upgrades['BACKDOOR'] || 0;

  const projectileCount = 1 + (forkLevel * 2);
  const damage = 1 + dmgLevel;
  const speed = config.bulletSpeed;
  const life = config.bulletLife;

  // 2. Base Targeting
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const baseAngle = Math.atan2(dy, dx);

  // 3. Determine Config ID (Visuals)
  let configId = 'PLAYER_STANDARD';
  if (forkLevel > 0) configId = 'PLAYER_FORK';
  
  // 4. Generate Main Frontal Arc (Fork)
  const baseSpread = 0.15;
  const spreadAngle = baseSpread; 
  const startAngle = baseAngle - ((projectileCount - 1) * spreadAngle) / 2;

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

  // 5. Generate Backdoor (Rear Shot)
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
          configId: 'PLAYER_BACKDOOR',
          isHoming: false
      });
  }

  // 6. Generate Sniffers (Homing Swarm)
  if (snifferLevel > 0) {
      const angleStep = (Math.PI * 2) / snifferLevel;
      const angleOffset = baseAngle + (Math.PI / 4); 
      
      for(let i=0; i<snifferLevel; i++) {
          const angle = angleOffset + (i * angleStep);
          
          const spawnX = origin.x + Math.cos(angle) * MUZZLE_OFFSET;
          const spawnY = origin.y + Math.sin(angle) * MUZZLE_OFFSET;

          shots.push({
              x: spawnX,
              y: spawnY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              damage,
              life,
              configId: 'PLAYER_SNIFFER',
              isHoming: true
          });
      }
  }

  return shots;
};
