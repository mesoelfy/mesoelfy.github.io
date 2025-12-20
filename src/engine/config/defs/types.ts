import { Tag } from '@/engine/ecs/types';
import { ComponentType } from '@/engine/ecs/ComponentType';

export interface VisualDef {
  model: 'CONE' | 'ICOSA' | 'OCTA' | 'TETRA' | 'SPHERE' | 'CAPSULE' | 'CYLINDER' | 'TORUS' | 'BOX' | 'CUSTOM_HUNTER' | 'CUSTOM_CHEVRON';
  color: string; // Hex
  scale: [number, number, number];
  material: 'ENEMY_BASE' | 'PROJECTILE' | 'PLAYER';
  // Procedural Params
  height?: number;
  radius?: number;
  segments?: number;
  detail?: number;
}

export interface PhysicsDef {
  radius: number;
  mass: number; // For knockback resistance? (Future proofing)
  friction: number;
}

export interface WeaponDef {
  id: string;
  damage: number;
  speed: number;
  life: number;
  fireRate?: number; // Only for player/enemies
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
  damage: number; // Collision damage
  score: number;
  xp: number;
  ai: string; // Behavior Tree ID
  visual: VisualDef;
  physics: PhysicsDef;
  // Specific AI Params
  params?: Record<string, any>;
}
