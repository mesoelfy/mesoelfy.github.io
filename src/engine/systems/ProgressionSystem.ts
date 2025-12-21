import { IGameSystem, IGameEventService } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { PLAYER_CONFIG } from '@/engine/config/PlayerConfig';
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
  }

  public addXp(amount: number) {
    this.xp += amount;
    while (this.xp >= this.xpToNextLevel) {
        this.xp -= this.xpToNextLevel;
        this.level++;
        this.upgradePoints++;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * PLAYER_CONFIG.xpScalingFactor);
        
        this.events.emit(GameEvents.THREAT_LEVEL_UP, { level: this.level });
    }
  }

  public applyUpgrade(option: UpgradeOption) {
      if (this.upgradePoints > 0) {
          this.upgradePoints--;
          
          // Instant-use options don't increment a level counter
          if (option === 'PURGE' || option === 'RESTORE' || option === 'DAEMON') {
              return;
          }
          
          const current = this.activeUpgrades[option] || 0;
          this.activeUpgrades[option] = current + 1;
      }
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
  }

  teardown(): void {}
}
