import { IGameSystem, IEntitySpawner } from '@/engine/interfaces';
import { EnemyTypes } from '@/engine/config/Identifiers';
import { ViewportHelper } from '@/engine/math/ViewportHelper';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { ENEMIES } from '@/engine/config/defs/Enemies';

// Dynamic offset from the new definition
const DRILLER_OFFSET = (ENEMIES.driller.visual.height || 1.0) / 2; 

export class MobileWaveSystem implements IGameSystem {
  private time = 0;
  private nextSpawn = 0;
  
  // Difficulty Config
  private readonly START_INTERVAL = 1.2;
  private readonly MIN_INTERVAL = 0.4;
  private readonly RAMP_DURATION = 60.0;

  constructor(private spawner: IEntitySpawner) {}

  update(delta: number, time: number): void {
    this.time += delta;

    if (this.time >= this.nextSpawn) {
        this.spawnDriller();
        
        const progress = Math.min(1.0, this.time / this.RAMP_DURATION);
        const currentInterval = this.START_INTERVAL - (progress * (this.START_INTERVAL - this.MIN_INTERVAL));
        
        this.nextSpawn = this.time + currentInterval;
    }
  }

  private spawnDriller() {
      const { width, height } = ViewportHelper.viewport;
      const pad = 3.0; 
      
      const isTop = Math.random() > 0.5;
      
      let x = (Math.random() - 0.5) * (width * 0.6); 
      let y = 0;

      if (isTop) { 
          y = (height / 2) + pad;
      } else { 
          y = -(height / 2) - pad;
      }

      this.spawner.spawn(EnemyTypes.DRILLER, {
          [ComponentType.Transform]: { 
              x, y, 
              scale: 1.0, 
              rotation: Math.atan2(isTop ? -1 : 1, 0) // Point towards center
          },
          [ComponentType.State]: { 
              current: 'ACTIVE',
              timers: { 
                  spawn: 0,
                  drillAudio: Math.random() * 0.2 
              } 
          },
          [ComponentType.RenderTransform]: { 
              scale: 1.0 
          }
      });
  }

  teardown(): void {}
}
