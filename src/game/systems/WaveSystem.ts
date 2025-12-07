import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { EntitySystem } from './EntitySystem';
import { useGameStore } from '../store/useGameStore';

// --- AGGRESSIVE WAVE CONFIG ---
const WAVE_TIMELINE = [
  { at: 0,     type: 'driller', count: 3, interval: 0.1 }, 
  { at: 2,     type: 'driller', count: 5, interval: 0.5 }, 
  { at: 5,     type: 'kamikaze', count: 2, interval: 1.0 },
  { at: 8,     type: 'driller', count: 8, interval: 0.2 }, 
  { at: 12,    type: 'hunter',  count: 1, interval: 0 },   
  { at: 15,    type: 'driller', count: 10, interval: 0.1 },
  { at: 20,    type: 'kamikaze', count: 5, interval: 0.5 },
  { at: 25,    type: 'hunter',  count: 3, interval: 1.0 }, 
];

export class WaveSystem implements IGameSystem {
  private entitySystem!: EntitySystem;
  private waveTime = 0;
  private currentWaveIndex = 0;
  private spawnQueue: { type: string, time: number }[] = [];
  private loopCount = 0;

  setup(locator: IServiceLocator): void {
    this.entitySystem = locator.getSystem<EntitySystem>('EntitySystem');
    this.reset();
  }

  private reset() {
    this.waveTime = 0;
    this.currentWaveIndex = 0;
    this.spawnQueue = [];
    this.loopCount = 0;
  }

  update(delta: number, time: number): void {
    // FIX: Stop spawning if Zen Mode is active
    if (useGameStore.getState().isZenMode) return;

    this.waveTime += delta;
    this.checkTimeline();
    this.processQueue(time);
  }

  private checkTimeline() {
    if (this.currentWaveIndex >= WAVE_TIMELINE.length) {
        this.waveTime = 0;
        this.currentWaveIndex = 0;
        this.loopCount++;
    }

    const nextWave = WAVE_TIMELINE[this.currentWaveIndex];
    if (nextWave && this.waveTime >= nextWave.at) {
        this.queueSpawns(nextWave);
        this.currentWaveIndex++;
    }
  }

  private queueSpawns(wave: any) {
    const count = wave.count + (this.loopCount * 2);
    for (let i = 0; i < count; i++) {
        this.spawnQueue.push({
            type: wave.type,
            time: this.waveTime + (i * wave.interval)
        });
    }
  }

  private processQueue(currentTime: number) {
    for (let i = this.spawnQueue.length - 1; i >= 0; i--) {
        const spawn = this.spawnQueue[i];
        if (this.waveTime >= spawn.time) {
            this.entitySystem.spawnEnemy(spawn.type as any);
            this.spawnQueue.splice(i, 1);
        }
    }
  }

  teardown(): void {
    this.reset();
  }
}
