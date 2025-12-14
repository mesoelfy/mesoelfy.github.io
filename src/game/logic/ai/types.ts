import { Entity } from '../../core/ecs/Entity';
import { ConfigService } from '@/game/services/ConfigService';

export interface AIContext {
  delta: number;
  time: number;
  
  spawnProjectile: (x: number, y: number, vx: number, vy: number, damage?: number) => void;
  spawnDrillSparks: (x: number, y: number, angle: number) => void; 
  spawnLaunchSparks: (x: number, y: number, angle: number) => void; 
  spawnFX: (type: string, x: number, y: number) => void;
  playSound: (key: string, x?: number) => void; // UPDATED
  
  damagePanel: (id: string, amount: number) => void;
  
  getUpgradeLevel: (key: string) => number;
  
  config: typeof ConfigService;
}

export interface EnemyLogic {
  update(entity: Entity, ctx: AIContext): void;
}
