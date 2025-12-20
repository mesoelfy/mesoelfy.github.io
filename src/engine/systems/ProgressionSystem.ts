import { IGameSystem, IGameEventService } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { PLAYER_CONFIG } from '@/engine/config/PlayerConfig';
import { GameStream } from '@/engine/state/GameStream';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { UpgradeOption } from '@/engine/types/game.types';

export class ProgressionSystem implements IGameSystem {
  public score: number = 0;
  public xp: number = 0;
  public level: number = 1;
  public xpToNextLevel: number = PLAYER_CONFIG.baseXpRequirement;
  public upgradePoints: number = 0;
  
  public activeUpgrades: Partial<Record<UpgradeOption, number>> = {};

  constructor(private events: IGameEventService) {
    this.events.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        this.applyUpgrade(p.option as UpgradeOption);
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
    GameStream.set('SCORE', this.score);
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
    
    GameStream.set('XP', this.xp);
    GameStream.set('XP_NEXT', this.xpToNextLevel);
    GameStream.set('LEVEL', this.level);
  }

  public applyUpgrade(option: UpgradeOption) {
      if (this.upgradePoints > 0) {
          this.upgradePoints--;
          
          if (option === 'PURGE' || option === 'RESTORE' || option === 'DAEMON') {
              this.syncStore(); 
              return;
          }
          
          const current = this.activeUpgrades[option] || 0;
          this.activeUpgrades[option] = current + 1;
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
      
      GameStream.set('SCORE', 0);
      GameStream.set('XP', 0);
      GameStream.set('XP_NEXT', this.xpToNextLevel);
      GameStream.set('LEVEL', 1);
  }

  teardown(): void {}
}
