import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { EntitySystem } from './EntitySystem';
import { EnemyTypes } from '../config/Identifiers';

// --- AGGRESSIVE WAVE CONFIG ---
const WAVE_TIMELINE = [
  // TIME (s) |  TYPE     | COUNT | INTERVAL
  { at: 0,     type: 'muncher', count: 3, interval: 0.1 },  // Instant Start
  { at: 2,     type: 'muncher', count: 5, interval: 0.5 },  // Pressure
  { at: 5,     type: 'kamikaze', count: 2, interval: 1.0 }, // First Threat
  { at: 8,     type: 'muncher', count: 8, interval: 0.2 },  // Swarm
  { at: 12,    type: 'hunter',  count: 1, interval: 0 },    // Mini Boss
  { at: 15,    type: 'muncher', count: 10, interval: 0.1 }, // Chaos
  { at: 20,    type: 'kamikaze', count: 5, interval: 0.5 }, // Bombardment
  { at: 25,    type: 'hunter',  count: 3, interval: 1.0 },  // Hunter Squad
];

// Loop logic: After 30s, repeat the last few entries with higher density? 
// For now, we just loop the whole thing with a difficulty multiplier.

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
    this.waveTime += delta;

    // 1. Check Timeline
    this.checkTimeline();

    // 2. Process Spawn Queue
    this.processQueue(time);
  }

  private checkTimeline() {
    // If we exhausted the timeline, loop it (simulated)
    if (this.currentWaveIndex >= WAVE_TIMELINE.length) {
        // Reset timeline but keep difficulty up? 
        // Simple loop for debugging:
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
    // Increase count by loop number (Aggressive scaling)
    const count = wave.count + (this.loopCount * 2);
    
    for (let i = 0; i < count; i++) {
        this.spawnQueue.push({
            type: wave.type,
            time: this.waveTime + (i * wave.interval)
        });
    }
  }

  private processQueue(currentTime: number) {
    // Sort queue by time? Assuming insertion order is roughly correct for now.
    // Actually, queue times are relative to waveTime.
    
    // We iterate backwards to remove easily
    for (let i = this.spawnQueue.length - 1; i >= 0; i--) {
        const spawn = this.spawnQueue[i];
        
        // If it's time to spawn relative to waveTime
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
