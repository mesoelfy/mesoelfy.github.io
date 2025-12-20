import { Entity } from '@/engine/ecs/Entity';
import { ConfigService } from '@/engine/services/ConfigService';
import { WorldRect } from '@/engine/math/ViewportHelper';
import { AudioKey, VFXKey } from '@/engine/config/AssetKeys';
import { PanelId } from '@/engine/config/PanelConfig';
import { DamageOptions } from '@/engine/interfaces';

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

  spawnFX: (type: VFXKey, x: number, y: number, angle?: number) => void;
  spawnParticle: (x: number, y: number, color: string, vx: number, vy: number, life: number, size?: number) => void;
  
  playSound: (key: AudioKey, x?: number) => void;
  damagePanel: (id: PanelId, amount: number, options?: DamageOptions) => void;
  
  getPanelRect: (id: PanelId) => WorldRect | undefined;
  getUpgradeLevel: (key: string) => number;
  
  config: typeof ConfigService;
}

export interface EnemyLogic {
  update(entity: Entity, ctx: AIContext): void;
}
