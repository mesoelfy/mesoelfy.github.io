import { IGameSystem, IEntitySpawner } from '@/engine/interfaces';
import { EnemyTypes } from '@/engine/config/Identifiers';
import { ViewportHelper } from '@/engine/math/ViewportHelper';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { ENEMIES } from '@/engine/config/defs/Enemies';

export class MobileWaveSystem implements IGameSystem {
  private time = 0;
  private nextSpawn = 0;
  
  // Difficulty Config
  private readonly START_INTERVAL = 1.0;
  private readonly MIN_INTERVAL = 0.3;
  private readonly RAMP_DURATION = 45.0; // Reach max difficulty in 45s

  constructor(private spawner: IEntitySpawner) {}

  update(delta: number, time: number): void {
    this.time += delta;

    if (this.time >= this.nextSpawn) {
        this.spawnDriller();
        
        // Linear difficulty ramp
        const progress = Math.min(1.0, this.time / this.RAMP_DURATION);
        const currentInterval = this.START_INTERVAL - (progress * (this.START_INTERVAL - this.MIN_INTERVAL));
        
        this.nextSpawn = this.time + currentInterval;
    }
  }

  private spawnDriller() {
      // Logic: Spawn outside the viewport and move inwards
      const { width, height } = ViewportHelper.viewport;
      
      // Safety check if viewport isn't ready
      if (width <= 1 || height <= 1) return;

      const pad = 4.0; // Spawn distance outside screen
      const isTop = Math.random() > 0.5;
      
      // Random X within the center column (approx panel width)
      const spawnWidth = width * 0.5; 
      let x = (Math.random() - 0.5) * spawnWidth; 
      let y = 0;

      if (isTop) { 
          y = (height / 2) + pad;
      } else { 
          y = -(height / 2) - pad;
      }

      // Point towards center (0,0) where the panel is
      const angle = Math.atan2(-y, -x);

      this.spawner.spawn(EnemyTypes.DRILLER, {
          [ComponentType.Transform]: { 
              x, y, 
              scale: 1.0, 
              rotation: angle 
          },
          // Ensure they start in ACTIVE state so they move immediately
          [ComponentType.State]: { 
              current: 'ACTIVE',
              timers: { 
                  spawn: 0,
                  drillAudio: Math.random() * 0.2 
              } 
          },
          [ComponentType.Target]: {
              type: 'PANEL',
              // Force scan immediately
              locked: false 
          },
          [ComponentType.RenderTransform]: { 
              scale: 1.0 
          }
      });
  }

  teardown(): void {}
}
