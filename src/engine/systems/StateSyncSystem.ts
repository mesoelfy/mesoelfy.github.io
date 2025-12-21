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
    points: -1
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

    // 1. Health
    if (hp !== this.cache.health) {
      GameStream.set('PLAYER_HEALTH', hp);
      // We use getState().set... to allow the slice to handle any side-effects if needed,
      // or direct setState if the slice just sets the value. 
      // Using direct setState here for raw data sync to match previous logic.
      useGameStore.setState({ playerHealth: hp });
      this.cache.health = hp;
    }

    // 2. Max Health
    if (max !== this.cache.maxHealth) {
      GameStream.set('PLAYER_MAX_HEALTH', max);
      useGameStore.setState({ maxPlayerHealth: max });
      this.cache.maxHealth = max;
    }

    // 3. Reboot Progress
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

    // 1. Score
    if (score !== this.cache.score) {
      GameStream.set('SCORE', score);
      // Use the slice action for score to handle High Score logic
      useGameStore.getState().setScore(score);
      this.cache.score = score;
    }

    // 2. XP & Leveling
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
  }

  private syncIntegrity() {
    // PanelRegistrySystem usually handles its own store updates for Panel Registration,
    // but the aggregate Integrity score is a calculated value we want to stream.
    const integrity = this.panelSys.systemIntegrity;
    
    if (integrity !== this.cache.integrity) {
        GameStream.set('SYSTEM_INTEGRITY', integrity);
        // Note: PanelSystem might update the store directly during damage calculations,
        // but syncing here ensures GameStream is always 1:1 with the simulation frame.
        this.cache.integrity = integrity;
    }
  }

  teardown(): void {
    // No cleanup needed for pure sync
  }
}
