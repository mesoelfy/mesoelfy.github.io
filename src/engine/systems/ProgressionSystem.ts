import { IGameSystem, IGameEventService } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { PLAYER_CONFIG } from '@/engine/config/PlayerConfig';
import { TransientDOMService } from '@/engine/services/TransientDOMService';
import { useGameStore } from '@/engine/state/game/useGameStore';

export class ProgressionSystem implements IGameSystem {
  public score: number = 0;
  public xp: number = 0;
  public level: number = 1;
  public xpToNextLevel: number = PLAYER_CONFIG.baseXpRequirement;
  public upgradePoints: number = 0;
  public activeUpgrades: Record<string, number> = {
    'OVERCLOCK': 0, 'EXECUTE': 0, 'FORK': 0,
    'SNIFFER': 0, 'BACKDOOR': 0, 'REPAIR_NANITES': 0
  };

  constructor(private events: IGameEventService) {
    this.events.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        this.applyUpgrade(p.option);
    });
    
    this.events.subscribe(GameEvents.ENEMY_DESTROYED, () => {
        this.addScore(1);
        this.addXp(10);
    });
    
    this.reset();
  }

  update(delta: number, time: number): void {}

  public addScore(amount: number) {
    this.score += amount;
    TransientDOMService.update('score-display', this.score.toString().padStart(4, '0'));
  }

  public addXp(amount: number) {
    this.xp += amount;
    while (this.xp >= this.xpToNextLevel) {
        this.xp -= this.xpToNextLevel;
        this.level++;
        this.upgradePoints++;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * PLAYER_CONFIG.xpScalingFactor);
        
        this.events.emit(GameEvents.THREAT_LEVEL_UP, { level: this.level });
        this.syncStore();
    }
    
    const xpPercent = this.xpToNextLevel > 0 ? (this.xp / this.xpToNextLevel) : 0;
    TransientDOMService.update('xp-progress', xpPercent);
  }

  public applyUpgrade(option: string) {
      if (this.upgradePoints > 0) {
          this.upgradePoints--;
          if (option === 'PURGE' || option === 'RESTORE' || option === 'DAEMON') {
              this.syncStore(); 
              return;
          }
          this.activeUpgrades[option] = (this.activeUpgrades[option] || 0) + 1;
          this.syncStore();
      }
  }

  private syncStore() {
      useGameStore.getState().setProgressionData({
          xp: this.xp,
          level: this.level,
          nextXp: this.xpToNextLevel,
          points: this.upgradePoints
      });
  }

  public reset() {
      this.score = 0;
      this.xp = 0;
      this.level = 1;
      this.xpToNextLevel = PLAYER_CONFIG.baseXpRequirement;
      this.upgradePoints = 0;
      this.activeUpgrades = { 
        'OVERCLOCK': 0, 'EXECUTE': 0, 'FORK': 0,
        'SNIFFER': 0, 'BACKDOOR': 0, 'REPAIR_NANITES': 0
      };
      
      TransientDOMService.update('score-display', "0000");
      TransientDOMService.update('xp-progress', 0);
      TransientDOMService.update('player-lvl-text', "LVL_01");
  }

  teardown(): void {}
}
