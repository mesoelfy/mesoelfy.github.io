import { Entity } from '@/engine/ecs/Entity';
import { ConfigService } from '@/sys/services/ConfigService';
import { WorldRect } from '@/engine/math/ViewportHelper';

export interface AIContext {
  delta: number;
  time: number;
  
  spawnProjectile: (x: number, y: number, vx: number, vy: number, damage?: number) => void;
  spawnDrillSparks: (x: number, y: number, angle: number) => void; 
  spawnLaunchSparks: (x: number, y: number, angle: number) => void; 
  spawnFX: (type: string, x: number, y: number) => void;
  playSound: (key: string, x?: number) => void;
  
  damagePanel: (id: string, amount: number) => void;
  getPanelRect: (id: string) => WorldRect | undefined; // NEW
  
  getUpgradeLevel: (key: string) => number;
  
  config: typeof ConfigService;
}

export interface EnemyLogic {
  update(entity: Entity, ctx: AIContext): void;
}
