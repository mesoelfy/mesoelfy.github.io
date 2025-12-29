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

// Geometry Constants derived from PlayerActor.tsx
const RETICLE_EXTENT_RADIUS = 0.65; 
// Geometry Constants derived from AssetCatalog (Sphere Radius 0.5 * Base Scale 0.4)
const PROJ_BASE_RADIUS = 0.2; 
// Increased margin for better visual clearance (was 0.15)
const SPAWN_MARGIN = 0.3; 

// Sniffer Reticle config
const SNIFFER_OFFSET_RADIUS = 1.65; 
const TWIST_OFFSET = -0.55;  

const SNIFFER_TIPS = [
    Math.PI + TWIST_OFFSET,           
    0 + TWIST_OFFSET,                 
    Math.PI * 1.5 + TWIST_OFFSET,     
    Math.PI / 2 + TWIST_OFFSET        
];

export const calculateSpitterShot = (
  origin: { x: number, y: number },
  target: { x: number, y: number },
  state: SpitterState
): ShotDef => {
  const config = ConfigService.player;
  const damage = 1 + state.damageLevel;
  const speed = config.bulletSpeed; 
  const life = config.bulletLife;

  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const angle = Math.atan2(dy, dx);

  // --- DYNAMIC OFFSET CALCULATION ---
  // Matches WeaponSystem.ts scaling logic: 1.0 + (level * 0.75)
  const sizeMultiplier = 1.0 + (state.girthLevel * 0.75);
  const currentProjRadius = PROJ_BASE_RADIUS * sizeMultiplier;
  
  // Place center of projectile so its edge touches reticle edge + margin
  const dynamicOffset = RETICLE_EXTENT_RADIUS + currentProjRadius + SPAWN_MARGIN;

  const spawnX = origin.x + Math.cos(angle) * dynamicOffset;
  const spawnY = origin.y + Math.sin(angle) * dynamicOffset;

  return {
      x: spawnX,
      y: spawnY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage,
      life,
      configId: WeaponIDs.PLAYER_SPITTER,
      isHoming: false
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
      const tipX = origin.x + Math.cos(globalAngle) * SNIFFER_OFFSET_RADIUS;
      const tipY = origin.y + Math.sin(globalAngle) * SNIFFER_OFFSET_RADIUS;
      const vx = Math.cos(globalAngle) * speed * 0.5;
      const vy = Math.sin(globalAngle) * speed * 0.5;
      
      shots.push({
          x: tipX, y: tipY, vx, vy,
          damage, life, configId: WeaponIDs.PLAYER_SNIFFER, isHoming: true
      });
  }
  return shots;
};
