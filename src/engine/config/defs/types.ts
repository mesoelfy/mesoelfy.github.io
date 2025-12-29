import { Tag } from '@/engine/ecs/types';
import { ComponentType } from '@/engine/ecs/ComponentType';

export interface VisualDef {
  model: 'CONE' | 'ICOSA' | 'OCTA' | 'TETRA' | 'SPHERE' | 'CAPSULE' | 'CYLINDER' | 'TORUS' | 'BOX' | 'CUSTOM_HUNTER' | 'CUSTOM_CHEVRON' | 'CRESCENT';
  color: string; // Hex
  scale: [number, number, number];
  // Updated to include specific projectile materials
  material: 'ENEMY_BASE' | 'PLAYER' | 'PROJECTILE_PLAYER' | 'PROJECTILE_ENEMY' | 'PROJECTILE_HUNTER' | 'PROJECTILE_PURGE';
  // Procedural Params
  height?: number;
  radius?: number;
  segments?: number;
  detail?: number;
}

export interface PhysicsDef {
  radius: number;
  mass: number; 
  friction: number;
}

export interface WeaponDef {
  id: string;
  damage: number;
  speed: number;
  life: number;
  fireRate?: number; 
  behavior?: {
    spinSpeed?: number;
    pulseSpeed?: number;
    faceVelocity?: boolean;
    homing?: boolean;
  };
  visual: VisualDef;
  tags: Tag[];
}

export interface EnemyDef {
  id: string;
  health: number;
  damage: number; 
  score: number;
  xp: number;
  ai: string; 
  visual: VisualDef;
  physics: PhysicsDef;
  params?: Record<string, any>;
}
