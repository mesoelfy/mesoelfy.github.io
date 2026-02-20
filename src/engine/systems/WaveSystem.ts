import { IGameSystem, IEntitySpawner, IPanelSystem, IGameEventService } from '@/engine/interfaces';
import { EnemyTypes, ArchetypeID } from '@/engine/config/Identifiers';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { ENEMIES } from '@/engine/config/defs/Enemies';
import { GameEvents } from '@/engine/signals/GameEvents';
import { ViewportHelper } from '@/engine/math/ViewportHelper';
import { AI_STATE } from '@/engine/ai/AIStateTypes';
import waves from '@/engine/config/static/waves.json';
import scenario from '@/engine/config/static/scenario.json';

interface WaveDef {
    at: number;
    type: string;
    count: number;
    interval: number;
}

export class WaveSystem implements IGameSystem {
  private waveTime = 0;
  private currentWaveIndex = 0;
  private spawnQueue: { type: ArchetypeID, time: number }[] = [];
  private loopCount = 0;
  private timeline: WaveDef[] = waves as WaveDef[];
  private scenarioInit = false;
  private hasStressTested = false;
  
  private isZenMode = false;
  private isSandbox = false;
  private peaceMode = false;
  private unsubs: (() => void)[] = [];

  constructor(
    private spawner: IEntitySpawner,
    private panelSystem: IPanelSystem,
    private events: IGameEventService
  ) {
    this.reset();
    this.unsubs.push(this.events.subscribe(GameEvents.GAME_OVER, () => this.triggerStressTest()));
    this.unsubs.push(this.events.subscribe(GameEvents.GLOBAL_STATE_SYNC, (p) => {
        this.isZenMode = p.isZenMode;
        this.isSandbox = p.bootState === 'sandbox';
        this.peaceMode = p.debugFlags.peaceMode;
    }));
  }

  private reset() {
    this.waveTime = 0;
    this.currentWaveIndex = 0;
    this.spawnQueue = [];
    this.loopCount = 0;
    this.scenarioInit = false;
    this.hasStressTested = false;
  }

  update(delta: number, time: number): void {
    if (this.isZenMode || this.isSandbox) return;
    
    if (this.panelSystem.systemIntegrity > 0) {
        if (!this.scenarioInit) {
            const panels = this.panelSystem.getAllPanels();
            const ready = panels.some(p => p.width > 0);
            
            if (ready) {
                this.runScenario(panels);
                this.scenarioInit = true;
            }
        }

        this.waveTime += delta;
        
        if (!this.peaceMode) {
            this.checkTimeline();
            this.processQueue(time);
        }

        this.handleBreaches(delta);
    }
  }

  private triggerStressTest() {
      if (this.hasStressTested) return;
      this.hasStressTested = true;

      const { width, height } = ViewportHelper.viewport;
      const types = [EnemyTypes.DRILLER, EnemyTypes.HUNTER, EnemyTypes.KAMIKAZE];
      const countPerType = 100;

      types.forEach(type => {
          for(let i = 0; i < countPerType; i++) {
              const x = (Math.random() - 0.5) * width * 1.5;
              const y = (Math.random() - 0.5) * height * 1.5;
              
              this.spawner.spawn(type, {
                  [ComponentType.Transform]: { x, y },
                  [ComponentType.State]: { current: AI_STATE.SPAWN, timers: {} },
                  [ComponentType.RenderTransform]: { scale: 1.0 },
                  [ComponentType.RenderEffect]: { spawnProgress: 0.0, spawnVelocity: 0.0 }
              });
          }
      });
  }

  private runScenario(panels: any[]) {
      for (const panelConfig of scenario.panels) {
          const targetPanel = panels.find(p => p.id === panelConfig.id);
          if (!targetPanel) continue;

          let dmg = panelConfig.damage || 0;
          if (panelConfig.damageMin !== undefined && panelConfig.damageMax !== undefined) {
              dmg = panelConfig.damageMin + Math.floor(Math.random() * (panelConfig.damageMax - panelConfig.damageMin));
          }
          if (dmg > 0) {
              this.panelSystem.damagePanel(targetPanel.id, dmg, { silent: true });
          }

          let enemyCount = panelConfig.enemies || 0;
          if (panelConfig.enemiesMin !== undefined && panelConfig.enemiesMax !== undefined) {
              enemyCount = panelConfig.enemiesMin + Math.floor(Math.random() * (panelConfig.enemiesMax - panelConfig.enemiesMin + 1));
          }
          if (enemyCount > 0) {
              this.spawnDrillerOn(targetPanel, enemyCount);
          }
      }
  }

  private spawnDrillerOn(panel: any, count: number) {
      const offset = ENEMIES[EnemyTypes.DRILLER].params?.spawnOffset || 0.32;

      for(let i=0; i<count; i++) {
          const side = Math.floor(Math.random() * 4);
          let edgeX = 0, edgeY = 0; 
          let normalX = 0, normalY = 0; 
          
          const halfW = panel.width / 2;
          const halfH = panel.height / 2;
          
          switch(side) {
              case 0:
                  edgeX = (Math.random() - 0.5) * panel.width; edgeY = halfH; normalX = 0; normalY = 1; break;
              case 1:
                  edgeX = (Math.random() - 0.5) * panel.width; edgeY = -halfH; normalX = 0; normalY = -1; break;
              case 2:
                  edgeX = -halfW; edgeY = (Math.random() - 0.5) * panel.height; normalX = -1; normalY = 0; break;
              case 3:
                  edgeX = halfW; edgeY = (Math.random() - 0.5) * panel.height; normalX = 1; normalY = 0; break;
          }

          const spawnX = panel.x + edgeX + (normalX * offset);
          const spawnY = panel.y + edgeY + (normalY * offset);
          const angle = Math.atan2(-normalY, -normalX);

          this.spawner.spawn(EnemyTypes.DRILLER, {
              [ComponentType.Transform]: { x: spawnX, y: spawnY, scale: 1.0, rotation: angle },
              [ComponentType.State]: { current: 'ACTIVE', timers: { spawn: 0, drillAudio: Math.random() * 0.2 } },
              [ComponentType.RenderTransform]: { scale: 1.0 }
          });
      }
  }

  private handleBreaches(delta: number) {
      if (this.peaceMode) return;

      const allPanels = this.panelSystem.getAllPanels();
      const deadPanels = allPanels.filter(p => p.isDestroyed && p.width > 0);
      
      if (deadPanels.length === 0) return;

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
    if (this.currentWaveIndex >= this.timeline.length) {
        this.waveTime = 0;
        this.currentWaveIndex = 0;
        this.loopCount++;
    }

    const nextWave = this.timeline[this.currentWaveIndex];
    if (nextWave && this.waveTime >= nextWave.at) {
        this.queueSpawns(nextWave);
        this.currentWaveIndex++;
    }
  }

  private queueSpawns(wave: WaveDef) {
    const count = wave.count + (this.loopCount * 2);
    const typeKey = wave.type as ArchetypeID; 
    
    for (let i = 0; i < count; i++) {
        this.spawnQueue.push({
            type: typeKey,
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
    this.unsubs.forEach(u => u());
    this.unsubs = [];
  }
}
