import { Entity } from '../../core/ecs/Entity';

export interface AIContext {
  delta: number;
  time: number;
  daemonMaxDamage?: number;
  spawnProjectile: (x, y: number, vx: number, vy: number) => void;
  spawnDrillSparks: (x: number, y: number, angle: number) => void; 
  spawnLaunchSparks: (x: number, y: number, angle: number) => void; 
  damagePanel: (id: string, amount: number) => void;
  // --- NEW ---
  playSound: (key: string) => void;
}

export interface EnemyLogic {
  update(entity: Entity, ctx: AIContext): void;
}
