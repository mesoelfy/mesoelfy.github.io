import { ServiceLocator } from '../core/ServiceLocator';
import { WAVE_CONFIG } from '../config/EnemyConfig';
import { EnemyTypes, EnemyType } from '../config/Identifiers';

export class WaveSystem {
  private lastSpawnTime = 0;

  public update(time: number, threatLevel: number) {
    if (time > this.lastSpawnTime + (WAVE_CONFIG.baseSpawnInterval / threatLevel)) {
      this.spawnRandomEnemy();
      this.lastSpawnTime = time;
    }
  }

  private spawnRandomEnemy() {
    const rand = Math.random();
    let type: EnemyType = EnemyTypes.MUNCHER;
    
    // Adjusted Probabilities for "More Munchers"
    // 0.0 - 0.60: Muncher (60%)
    // 0.60 - 0.90: Kamikaze (30%)
    // 0.90 - 1.00: Hunter (10%)
    
    if (rand < 0.60) type = EnemyTypes.MUNCHER;
    else if (rand < 0.90) type = EnemyTypes.KAMIKAZE;
    else type = EnemyTypes.HUNTER;

    ServiceLocator.entitySystem.spawnEnemy(type);
  }
}
