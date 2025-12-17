import { IGameSystem, IEntitySpawner } from '@/engine/interfaces';
import { EnemyTypes } from '@/engine/config/Identifiers';
import { ViewportHelper } from '@/engine/math/ViewportHelper';

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
        
        // Difficulty Ramp
        const progress = Math.min(1.0, this.time / this.RAMP_DURATION);
        const currentInterval = this.START_INTERVAL - (progress * (this.START_INTERVAL - this.MIN_INTERVAL));
        
        this.nextSpawn = this.time + currentInterval;
    }
  }

  private spawnDriller() {
      const { width, height } = ViewportHelper.viewport;
      const pad = 3.0; // Spawn further out
      
      // RESTRICT TO TOP AND BOTTOM ONLY
      const isTop = Math.random() > 0.5;
      
      let x = (Math.random() - 0.5) * (width * 0.6); // Keep them somewhat central horizontally
      let y = 0;

      if (isTop) { 
          y = (height / 2) + pad;
      } else { 
          y = -(height / 2) - pad;
      }

      this.spawner.spawnEnemy(EnemyTypes.DRILLER, x, y);
  }

  teardown(): void {}
}
