import { IGameSystem, IServiceLocator, IGameStateSystem, IPanelSystem, IEntityRegistry, IGameEventService, IAudioService } from '@/core/interfaces';
import { GameEvents } from '@/core/signals/GameEvents';
import { useStore } from '@/game/state/global/useStore'; 
import { RenderData } from '@/game/data/RenderData';
import { ComponentType } from '@/core/ecs/ComponentType';
import { Tag } from '@/core/ecs/types';
import * as THREE from 'three';

// Sub-Systems
import { HealthSystem } from './HealthSystem';
import { ProgressionSystem } from './ProgressionSystem';

// COLOR PALETTE (NEON BOOSTED)
const COL_SAFE = new THREE.Color("#00FF41"); // Matrix Green
const COL_WARN = new THREE.Color("#FFD700"); // Gold/Amber
const COL_CRIT = new THREE.Color("#FF003C"); // Critical Red
const COL_SBX  = new THREE.Color("#00FFFF"); // Cyan

export class GameStateSystem implements IGameStateSystem {
  private healthSys!: HealthSystem;
  private progSys!: ProgressionSystem;
  private panelSystem!: IPanelSystem;
  private registry!: IEntityRegistry;
  private events!: IGameEventService;
  private audio!: IAudioService;
  
  private heartbeatTimer: number = 0;
  private targetColor = new THREE.Color();
  private currentColor = new THREE.Color();

  setup(locator: IServiceLocator): void {
    this.panelSystem = locator.getSystem<IPanelSystem>('PanelRegistrySystem');
    this.registry = locator.getRegistry();
    this.events = locator.getGameEventBus();
    this.audio = locator.getAudioService();
    
    this.healthSys = locator.get<HealthSystem>('HealthSystem');
    this.progSys = locator.get<ProgressionSystem>('ProgressionSystem');
    
    this.events.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        if (p.option === 'REPAIR_NANITES') {
            this.healthSys.healPlayer(this.healthSys.maxPlayerHealth * 0.2);
        } else if (p.option === 'DAEMON') {
            this.events.emit(GameEvents.SPAWN_DAEMON, null);
        }
    });
  }

  update(delta: number, time: number): void {
      if (this.isGameOver) return;

      const integrity = this.panelSystem.systemIntegrity;
      
      // Heartbeat
      if (integrity < 30 && integrity > 0) {
          this.heartbeatTimer -= delta;
          if (this.heartbeatTimer <= 0) {
              const urgency = 1.0 - (integrity / 30);
              this.audio.playSound('loop_warning');
              this.events.emit(GameEvents.HEARTBEAT, { urgency });
              this.heartbeatTimer = 1.4 - (urgency * 1.05); 
          }
      } else {
          this.heartbeatTimer = 0;
      }

      this.updateAtmosphere(delta, integrity);
  }

  private updateAtmosphere(delta: number, integrity: number) {
      const worldEntities = this.registry.getByTag(Tag.WORLD);
      
      for (const world of worldEntities) {
          const render = world.getComponent<RenderData>(ComponentType.Render);
          if (render) {
              const bootState = useStore.getState().bootState;
              
              if (bootState === 'sandbox') this.targetColor.copy(COL_SBX);
              else if (integrity < 30) this.targetColor.copy(COL_CRIT);
              else if (integrity < 60) this.targetColor.copy(COL_WARN);
              else this.targetColor.copy(COL_SAFE);

              // Smooth Interpolation
              this.currentColor.setRGB(render.r, render.g, render.b);
              this.currentColor.lerp(this.targetColor, delta * 2.0);
              
              render.r = this.currentColor.r;
              render.g = this.currentColor.g;
              render.b = this.currentColor.b;
              
              // Scrolling
              render.visualRotation += 0.5 * delta; 
          }
      }
  }

  teardown(): void {
      this.healthSys.reset();
      this.progSys.reset();
  }

  // Proxies
  get playerHealth() { return this.healthSys.playerHealth; }
  get maxPlayerHealth() { return this.healthSys.maxPlayerHealth; }
  get playerRebootProgress() { return this.healthSys.playerRebootProgress; }
  get isGameOver() { return this.healthSys.isGameOver; }
  set isGameOver(v: boolean) { this.healthSys.isGameOver = v; }

  get score() { return this.progSys.score; }
  get xp() { return this.progSys.xp; }
  get level() { return this.progSys.level; }
  get xpToNextLevel() { return this.progSys.xpToNextLevel; }
  get upgradePoints() { return this.progSys.upgradePoints; }
  get activeUpgrades() { return this.progSys.activeUpgrades; }

  damagePlayer(amount: number) { this.healthSys.damagePlayer(amount); }
  healPlayer(amount: number) { this.healthSys.healPlayer(amount); }
  tickReboot(amount: number) { this.healthSys.tickReboot(amount); }
  decayReboot(amount: number) { this.healthSys.decayReboot(amount); }
  
  addScore(amount: number) { this.progSys.addScore(amount); }
  addXp(amount: number) { this.progSys.addXp(amount); }
}
