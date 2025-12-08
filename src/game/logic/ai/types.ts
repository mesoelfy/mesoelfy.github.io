import { Entity } from '../../core/ecs/Entity';

export interface AIContext {
  delta: number;
  time: number;
  spawnProjectile: (x: number, y: number, vx: number, vy: number) => void;
  // UPDATED: Now accepts angle for directional spray
  spawnDrillSparks: (x: number, y: number, angle: number) => void; 
  damagePanel: (id: string, amount: number) => void;
}

export interface EnemyLogic {
  update(entity: Entity, ctx: AIContext): void;
}
