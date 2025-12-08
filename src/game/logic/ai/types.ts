import { Entity } from '../../core/ecs/Entity';

export interface AIContext {
  delta: number;
  time: number;
  spawnProjectile: (x, y: number, vx: number, vy: number) => void;
  spawnDrillSparks: (x: number, y: number, angle: number) => void; 
  spawnLaunchSparks: (x: number, y: number, angle: number) => void; // NEW
  damagePanel: (id: string, amount: number) => void;
}

export interface EnemyLogic {
  update(entity: Entity, ctx: AIContext): void;
}
