import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { EntitySystem } from './EntitySystem';
import { WAVE_CONFIG } from '../config/EnemyConfig';
import { EnemyTypes, EnemyType } from '../config/Identifiers';

export class WaveSystem implements IGameSystem {
  private lastSpawnTime = 0;
  private entitySystem!: EntitySystem;

  setup(locator: IServiceLocator): void {
    this.entitySystem = locator.getSystem<EntitySystem>('EntitySystem');
  }

  update(delta: number, time: number): void {
    // We assume threatLevel is global for now, later passed via config or Locator
    // For Phase 1, we read the store directly (pragmatic)
    const threatLevel = 1; // Simplify for now
    
    if (time > this.lastSpawnTime + (WAVE_CONFIG.baseSpawnInterval / threatLevel)) {
      this.spawnRandomEnemy();
      this.lastSpawnTime = time;
    }
  }

  teardown(): void {}

  private spawnRandomEnemy() {
    const rand = Math.random();
    let type: EnemyType = EnemyTypes.MUNCHER;
    
    if (rand < 0.60) type = EnemyTypes.MUNCHER;
    else if (rand < 0.90) type = EnemyTypes.KAMIKAZE;
    else type = EnemyTypes.HUNTER;

    this.entitySystem.spawnEnemy(type);
  }
}
