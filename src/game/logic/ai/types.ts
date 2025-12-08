import { Entity } from '../../core/ecs/Entity';

export interface AIContext {
  delta: number;
  time: number;
  // Capabilities passed from System
  spawnProjectile: (x: number, y: number, vx: number, vy: number) => void;
  spawnDrillSparks: (x: number, y: number, color: string) => void; 
  damagePanel: (id: string, amount: number) => void;
  // Note: We removed 'playerPos' and 'panels' arrays because 
  // the TargetingSystem now handles that data via TargetComponent.
}

export interface EnemyLogic {
  update(entity: Entity, ctx: AIContext): void;
}
