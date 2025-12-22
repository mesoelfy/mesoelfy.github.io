import { IGameSystem, IPanelSystem } from '@/engine/interfaces';
import { HealthSystem } from './HealthSystem';
import { ProgressionSystem } from './ProgressionSystem';
import { GameStream } from '@/engine/state/GameStream';
import { useGameStore } from '@/engine/state/game/useGameStore';

export class StateSyncSystem implements IGameSystem {
  private cache = {
    health: -1,
    maxHealth: -1,
    reboot: -1,
    integrity: -1,
    score: -1,
    xp: -1,
    xpNext: -1,
    level: -1,
    points: -1,
    upgradesHash: "" // Track changes to upgrades object
  };

  constructor(
    private healthSys: HealthSystem,
    private progSys: ProgressionSystem,
    private panelSys: IPanelSystem
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
      useGameStore.setState({ playerHealth: hp });
      this.cache.health = hp;
    }

    if (max !== this.cache.maxHealth) {
      GameStream.set('PLAYER_MAX_HEALTH', max);
      useGameStore.setState({ maxPlayerHealth: max });
      this.cache.maxHealth = max;
    }

    if (reboot !== this.cache.reboot) {
      GameStream.set('PLAYER_REBOOT', reboot);
      useGameStore.setState({ playerRebootProgress: reboot });
      this.cache.reboot = reboot;
    }
  }

  private syncProgression() {
    const score = this.progSys.score;
    const xp = this.progSys.xp;
    const level = this.progSys.level;
    const next = this.progSys.xpToNextLevel;
    const points = this.progSys.upgradePoints;

    if (score !== this.cache.score) {
      GameStream.set('SCORE', score);
      useGameStore.getState().setScore(score);
      this.cache.score = score;
    }

    if (xp !== this.cache.xp || level !== this.cache.level || next !== this.cache.xpNext || points !== this.cache.points) {
      GameStream.set('XP', xp);
      GameStream.set('XP_NEXT', next);
      GameStream.set('LEVEL', level);
      
      useGameStore.getState().setProgressionData({
        xp,
        level,
        nextXp: next,
        points
      });

      this.cache.xp = xp;
      this.cache.level = level;
      this.cache.xpNext = next;
      this.cache.points = points;
    }

    // Sync Upgrades
    // Optimization: JSON.stringify is relatively fast for small objects like this
    const upgradesStr = JSON.stringify(this.progSys.activeUpgrades);
    if (upgradesStr !== this.cache.upgradesHash) {
        useGameStore.getState().setActiveUpgrades(this.progSys.activeUpgrades as Record<string, number>);
        this.cache.upgradesHash = upgradesStr;
    }
  }

  private syncIntegrity() {
    const integrity = this.panelSys.systemIntegrity;
    
    if (integrity !== this.cache.integrity) {
        GameStream.set('SYSTEM_INTEGRITY', integrity);
        this.cache.integrity = integrity;
    }
  }

  teardown(): void {
    // No cleanup needed
  }
}
