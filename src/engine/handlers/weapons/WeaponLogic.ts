import { ConfigService } from '@/engine/services/ConfigService';
import { WeaponIDs, ArchetypeID } from '@/engine/config/Identifiers';
import { SpitterState, SnifferState } from '@/engine/types/game.types';

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

const RETICLE_EXTENT_RADIUS = 0.65; 
const PROJ_BASE_RADIUS = 0.2; 
const SPAWN_MARGIN = 0.3; 

const SNIFFER_OFFSET_RADIUS = 1.65; 
const TWIST_OFFSET = -0.55;  

const SNIFFER_TIPS = [
    Math.PI + TWIST_OFFSET,           
    0 + TWIST_OFFSET,                 
    Math.PI * 1.5 + TWIST_OFFSET,     
    Math.PI / 2 + TWIST_OFFSET        
];

// ZERO-ALLOCATION: Writes directly to 'out' object
export const calculateSpitterShot = (
  origin: { x: number, y: number },
  target: { x: number, y: number },
  state: SpitterState,
  out: ShotDef
): void => {
  const config = ConfigService.player;
  const damage = 1 + state.damageLevel;
  const speed = config.bulletSpeed; 
  const life = config.bulletLife;

  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const angle = Math.atan2(dy, dx);

  const sizeMultiplier = 1.0 + (state.girthLevel * 0.75);
  const currentProjRadius = PROJ_BASE_RADIUS * sizeMultiplier;
  const dynamicOffset = RETICLE_EXTENT_RADIUS + currentProjRadius + SPAWN_MARGIN;

  out.x = origin.x + Math.cos(angle) * dynamicOffset;
  out.y = origin.y + Math.sin(angle) * dynamicOffset;
  out.vx = Math.cos(angle) * speed;
  out.vy = Math.sin(angle) * speed;
  out.damage = damage;
  out.life = life;
  out.configId = WeaponIDs.PLAYER_SPITTER;
  out.isHoming = false;
};

// ZERO-ALLOCATION: Writes to pre-allocated array, returns active count
export const calculateSnifferShots = (
  origin: { x: number, y: number },
  state: SnifferState,
  reticleRotation: number,
  outArr: ShotDef[]
): number => {
  const activeCount = state.capacityLevel; 
  if (activeCount <= 0) return 0;

  const damage = 1 + state.damageLevel;
  const speed = 22;
  const life = 3.0;

  for (let i = 0; i < activeCount; i++) {
      const localAngle = SNIFFER_TIPS[i % 4];
      const globalAngle = reticleRotation + localAngle;
      
      const shot = outArr[i];
      shot.x = origin.x + Math.cos(globalAngle) * SNIFFER_OFFSET_RADIUS;
      shot.y = origin.y + Math.sin(globalAngle) * SNIFFER_OFFSET_RADIUS;
      shot.vx = Math.cos(globalAngle) * speed * 0.5;
      shot.vy = Math.sin(globalAngle) * speed * 0.5;
      shot.damage = damage;
      shot.life = life;
      shot.configId = WeaponIDs.PLAYER_SNIFFER;
      shot.isHoming = true;
  }
  return activeCount;
};
