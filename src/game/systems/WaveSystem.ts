import { IGameSystem, IServiceLocator, IEntitySpawner } from '../core/interfaces';
import { useGameStore } from '../store/useGameStore';
import { useStore } from '@/core/store/useStore';
import { PanelRegistry } from './PanelRegistrySystem'; 
import { EnemyTypes } from '../config/Identifiers';

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

  setup(locator: IServiceLocator): void {
    this.spawner = locator.getSpawner();
    this.reset();
  }

  private reset() {
    this.waveTime = 0;
    this.currentWaveIndex = 0;
    this.spawnQueue = [];
    this.loopCount = 0;
  }

  update(delta: number, time: number): void {
    if (useGameStore.getState().isZenMode) return;
    if (useStore.getState().bootState === 'sandbox') return;

    this.waveTime += delta;
    
    // 1. Standard Waves (Disabled by Peace Mode)
    if (!useStore.getState().debugFlags.peaceMode) {
        this.checkTimeline();
        this.processQueue(time);
    }

    // 2. Breach Spawns (Disabled by Fortress Mode or Peace Mode)
    this.handleBreaches(delta);
  }

  private handleBreaches(delta: number) {
      const flags = useStore.getState().debugFlags;
      
      // If Fortress Mode is on, we assume the "Breach" is sealed/contained.
      // If Peace Mode is on, no enemies should spawn at all.
      if (flags.panelGodMode || flags.peaceMode) return;

      const allPanels = PanelRegistry.getAllPanels();
      const deadPanels = allPanels.filter(p => p.isDestroyed && p.width > 0);
      
      if (deadPanels.length === 0) return;

      // "Leak Rate" Calculation:
      const enemiesPerSecondPerPanel = 0.2 + (this.waveTime * 0.005);
      const spawnChance = enemiesPerSecondPerPanel * delta;

      for (const p of deadPanels) {
          if (Math.random() < spawnChance) {
              this.spawnBreachEnemy(p);
          }
      }
  }

  private spawnBreachEnemy(p: any) {
      const rand = Math.random();
      let type = EnemyTypes.DRILLER;
      if (rand > 0.85) type = EnemyTypes.HUNTER;
      else if (rand > 0.60) type = EnemyTypes.KAMIKAZE;

      const safeW = p.width * 0.7; 
      const safeH = p.height * 0.7;
      
      const offsetX = (Math.random() - 0.5) * safeW;
      const offsetY = (Math.random() - 0.5) * safeH;
      
      this.spawner.spawnEnemy(type, p.x + offsetX, p.y + offsetY);
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
