import { IGameSystem, IServiceLocator, IEntitySpawner } from '../core/interfaces';
import { useGameStore } from '../store/useGameStore';
import { useStore } from '@/core/store/useStore';
import { PanelRegistry } from './PanelRegistrySystem'; 
import { EnemyTypes } from '../config/Identifiers';

// Faster initial timeline for testing
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
  private spawner!: IEntitySpawner;
  private waveTime = 0;
  private currentWaveIndex = 0;
  private spawnQueue: { type: string, time: number }[] = [];
  private loopCount = 0;
  
  private nextBreachTime = 2.0; // Aggressive start

  setup(locator: IServiceLocator): void {
    this.spawner = locator.getSpawner();
    this.reset();
  }

  private reset() {
    this.waveTime = 0;
    this.currentWaveIndex = 0;
    this.spawnQueue = [];
    this.loopCount = 0;
    this.nextBreachTime = 2.0; 
  }

  update(delta: number, time: number): void {
    if (useGameStore.getState().isZenMode) return;
    if (useStore.getState().debugFlags.peaceMode) return;
    if (useStore.getState().bootState === 'sandbox') return;

    this.waveTime += delta;
    this.checkTimeline();
    this.processQueue(time);
    this.checkBreaches(delta, time);
  }

  private checkBreaches(delta: number, time: number) {
      if (this.waveTime > this.nextBreachTime) {
          const allPanels = PanelRegistry.getAllPanels();
          const deadPanels = allPanels.filter(p => p.isDestroyed);
          
          if (deadPanels.length > 0) {
              const p = deadPanels[Math.floor(Math.random() * deadPanels.length)];
              
              // Calculate Intensity based on time
              const intensity = Math.min(4, Math.floor(this.waveTime / 15) + 1);
              
              console.log(`[WaveSystem] BREACH SPAWN at Panel '${p.id}'. Count: ${intensity}. Coords: ${p.x.toFixed(1)}, ${p.y.toFixed(1)}`);

              for(let i=0; i<intensity; i++) {
                  // Random type logic
                  const rand = Math.random();
                  let type = EnemyTypes.DRILLER;
                  if (rand > 0.8) type = EnemyTypes.HUNTER;
                  else if (rand > 0.6) type = EnemyTypes.KAMIKAZE;

                  // 50% width/height padding from center
                  const spawnW = p.width * 0.5;
                  const spawnH = p.height * 0.5;
                  
                  const offsetX = (Math.random() - 0.5) * spawnW;
                  const offsetY = (Math.random() - 0.5) * spawnH;
                  
                  this.spawner.spawnEnemy(type, p.x + offsetX, p.y + offsetY);
              }
          }

          // Schedule next breach (Every 3-6 seconds)
          this.nextBreachTime = this.waveTime + 3.0 + (Math.random() * 3.0);
      }
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
            const angle = Math.random() * Math.PI * 2;
            const radius = 25; 
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            this.spawner.spawnEnemy(spawn.type, x, y);
            this.spawnQueue.splice(i, 1);
        }
    }
  }

  teardown(): void {
    this.reset();
  }
}
