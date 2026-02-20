import { IGameSystem, IPanelSystem, IGameEventService } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { HealthSystem } from './HealthSystem';
import { ProgressionSystem } from './ProgressionSystem';
import { GameStream } from '@/engine/state/GameStream';

export class StateSyncSystem implements IGameSystem {
  private cache = {
    health: -1,
    maxHealth: -1,
    reboot: -1,
    integrity: -1,
    score: -1,
    xp: -1,
    xpNext: -1,
    level: -1
  };

  constructor(
    private healthSys: HealthSystem,
    private progSys: ProgressionSystem,
    private panelSys: IPanelSystem,
    private events: IGameEventService
  ) {}

  update(delta: number, time: number): void {
    this.syncHealth();
    this.syncProgression();
    this.syncIntegrity();
  }

  private syncHealth() {
    const hp = this.healthSys.playerHealth;
    const max = this.healthSys.maxPlayerHealth;
    const reboot = this.healthSys.playerRebootProgress;

    if (hp !== this.cache.health) {
      GameStream.set('PLAYER_HEALTH', hp);
      this.cache.health = hp;
    }

    if (max !== this.cache.maxHealth) {
      GameStream.set('PLAYER_MAX_HEALTH', max);
      this.cache.maxHealth = max;
    }

    if (reboot !== this.cache.reboot) {
      GameStream.set('PLAYER_REBOOT', reboot);
      this.cache.reboot = reboot;
    }
  }

  private syncProgression() {
    const score = this.progSys.score;
    const xp = this.progSys.xp;
    const level = this.progSys.level;
    const next = this.progSys.xpToNextLevel;

    if (score !== this.cache.score) {
      GameStream.set('SCORE', score);
      this.events.emit(GameEvents.CMD_SET_SCORE, { score });
      this.cache.score = score;
    }

    if (xp !== this.cache.xp || level !== this.cache.level || next !== this.cache.xpNext) {
      GameStream.set('XP', xp);
      GameStream.set('XP_NEXT', next);
      GameStream.set('LEVEL', level);
      
      this.cache.xp = xp;
      this.cache.level = level;
      this.cache.xpNext = next;
    }
  }

  private syncIntegrity() {
    const integrity = this.panelSys.systemIntegrity;
    if (integrity !== this.cache.integrity) {
        GameStream.set('SYSTEM_INTEGRITY', integrity);
        this.cache.integrity = integrity;
    }
  }

  teardown(): void {}
}
