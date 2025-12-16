import { IGameSystem, IGameStateSystem, IPanelSystem, IEntityRegistry, IGameEventService, IAudioService } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { useStore } from '@/engine/state/global/useStore'; 
import { RenderData } from '@/engine/ecs/components/RenderData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { Tag } from '@/engine/ecs/types';
import * as THREE from 'three';

import { HealthSystem } from './HealthSystem';
import { ProgressionSystem } from './ProgressionSystem';

const COL_SAFE = new THREE.Color("#00FF41");
const COL_WARN = new THREE.Color("#FFD700");
const COL_CRIT = new THREE.Color("#FF003C");
const COL_SBX  = new THREE.Color("#00FFFF");

export class GameStateSystem implements IGameStateSystem {
  private heartbeatTimer: number = 0;
  private targetColor = new THREE.Color();
  private currentColor = new THREE.Color();

  constructor(
    private healthSys: HealthSystem,
    private progSys: ProgressionSystem,
    private panelSystem: IPanelSystem,
    private registry: IEntityRegistry,
    private events: IGameEventService,
    private audio: IAudioService
  ) {
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

              this.currentColor.setRGB(render.r, render.g, render.b);
              this.currentColor.lerp(this.targetColor, delta * 2.0);
              
              render.r = this.currentColor.r;
              render.g = this.currentColor.g;
              render.b = this.currentColor.b;
              
              render.visualRotation += 0.5 * delta; 
          }
      }
  }

  teardown(): void {
      this.healthSys.reset();
      this.progSys.reset();
  }

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
