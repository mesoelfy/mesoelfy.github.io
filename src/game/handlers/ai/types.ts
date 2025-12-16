import { Entity } from '@/core/ecs/Entity';
import { ConfigService } from '@/game/services/ConfigService';
import { WorldRect } from '@/core/math/ViewportHelper';

export interface AIContext {
  delta: number;
  time: number;
  
  spawnProjectile: (
      x: number, y: number, 
      vx: number, vy: number, 
      damage?: number, 
      configId?: string, 
      ownerId?: number
  ) => Entity;

  spawnDrillSparks: (x: number, y: number, angle: number) => void; 
  spawnLaunchSparks: (x: number, y: number, angle: number) => void; 
  spawnFX: (type: string, x: number, y: number) => void;
  // NEW: Direct particle access for smooth trails
  spawnParticle: (x: number, y: number, color: string, vx: number, vy: number, life: number, size?: number) => void;
  
  playSound: (key: string, x?: number) => void;
  damagePanel: (id: string, amount: number) => void;
  getPanelRect: (id: string) => WorldRect | undefined;
  getUpgradeLevel: (key: string) => number;
  
  config: typeof ConfigService;
}

export interface EnemyLogic {
  update(entity: Entity, ctx: AIContext): void;
}
