import { Entity } from '@/engine/ecs/Entity';
import { ConfigService } from '@/sys/services/ConfigService';
import { WorldRect } from '@/engine/math/ViewportHelper';
import { OrdnanceType } from '@/sys/data/OrdnanceData';

export interface AIContext {
  delta: number;
  time: number;
  
  // Updated signature: Returns Entity so we can track it
  spawnProjectile: (
      x: number, y: number, 
      vx: number, vy: number, 
      damage?: number, 
      ordnanceType?: OrdnanceType,
      ownerId?: number
  ) => Entity;

  spawnDrillSparks: (x: number, y: number, angle: number) => void; 
  spawnLaunchSparks: (x: number, y: number, angle: number) => void; 
  spawnFX: (type: string, x: number, y: number) => void;
  playSound: (key: string, x?: number) => void;
  
  damagePanel: (id: string, amount: number) => void;
  getPanelRect: (id: string) => WorldRect | undefined;
  
  getUpgradeLevel: (key: string) => number;
  
  config: typeof ConfigService;
}

export interface EnemyLogic {
  update(entity: Entity, ctx: AIContext): void;
}
