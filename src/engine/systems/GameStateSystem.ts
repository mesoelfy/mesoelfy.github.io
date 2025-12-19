import { IGameSystem, IGameStateSystem, IPanelSystem, IGameEventService, IAudioService } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { HealthSystem } from './HealthSystem';
import { ProgressionSystem } from './ProgressionSystem';

export class GameStateSystem implements IGameStateSystem {
  private heartbeatTimer: number = 0;

  constructor(
    private healthSys: HealthSystem,
    private progSys: ProgressionSystem,
    private panelSystem: IPanelSystem,
    private events: IGameEventService,
    private audio: IAudioService
  ) {
    this.events.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        if (p.option === 'REPAIR_NANITES') {
            // Buffed: Now heals 75% of max health
            this.healthSys.healPlayer(this.healthSys.maxPlayerHealth * 0.75);
            this.audio.playSound('ui_optimal');
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
