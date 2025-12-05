import { ServiceLocator } from '../core/ServiceLocator';
import { WAVE_CONFIG } from '../config/EnemyConfig';
import { Enemy } from '../types/game.types';

export class WaveSystem {
  private lastSpawnTime = 0;

  public update(time: number, threatLevel: number) {
    // Basic infinite wave logic (Phase 1 logic preserved)
    // In the future, this class will handle specific waves/formations
    
    if (time > this.lastSpawnTime + (WAVE_CONFIG.baseSpawnInterval / threatLevel)) {
      this.spawnRandomEnemy();
      this.lastSpawnTime = time;
    }
  }

  private spawnRandomEnemy() {
    const rand = Math.random();
    let type: Enemy['type'] = 'muncher';
    
    if (rand < 0.50) type = 'muncher';
    else if (rand < 0.80) type = 'kamikaze';
    else type = 'hunter';

    ServiceLocator.entitySystem.spawnEnemy(type);
  }
}
