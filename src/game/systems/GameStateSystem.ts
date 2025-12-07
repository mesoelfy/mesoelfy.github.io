import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { PLAYER_CONFIG } from '../config/PlayerConfig';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';

export class GameStateSystem implements IGameSystem {
  public playerHealth: number = PLAYER_CONFIG.maxHealth;
  public maxPlayerHealth: number = PLAYER_CONFIG.maxHealth;
  public playerRebootProgress: number = 0;
  
  public score: number = 0;
  public xp: number = 0;
  public level: number = 1;
  public xpToNextLevel: number = PLAYER_CONFIG.baseXpRequirement;
  public upgradePoints: number = 0;
  public activeUpgrades: Record<string, number> = {
    'RAPID_FIRE': 0, 'MULTI_SHOT': 0, 'SPEED_UP': 0, 'REPAIR_NANITES': 0
  };

  public isGameOver: boolean = false;

  setup(locator: IServiceLocator): void {
    this.reset();
    
    // Listen for Upgrades
    GameEventBus.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        this.applyUpgrade(p.option);
    });
    
    // REMOVED: Listener that caused Game Over on Identity Panel destruction.
    // The panel is now just another piece of hardware that can break and be fixed.
  }

  update(delta: number, time: number): void {}
  teardown(): void {}

  public reset() {
    this.playerHealth = this.maxPlayerHealth;
    this.playerRebootProgress = 0;
    this.score = 0;
    this.xp = 0;
    this.level = 1;
    this.xpToNextLevel = PLAYER_CONFIG.baseXpRequirement;
    this.upgradePoints = 0;
    this.isGameOver = false;
    this.activeUpgrades = { 'RAPID_FIRE': 0, 'MULTI_SHOT': 0, 'SPEED_UP': 0, 'REPAIR_NANITES': 0 };
  }

  public applyUpgrade(option: string) {
      if (this.upgradePoints > 0) {
          this.upgradePoints--;
          this.activeUpgrades[option] = (this.activeUpgrades[option] || 0) + 1;
          
          if (option === 'REPAIR_NANITES') {
             this.healPlayer(this.maxPlayerHealth * 0.2);
          }
      }
  }

  public damagePlayer(amount: number) {
    if (this.isGameOver) return;
    if (this.playerHealth > 0) {
        this.playerHealth = Math.max(0, this.playerHealth - amount);
    } else {
        this.playerRebootProgress = Math.max(0, this.playerRebootProgress - (amount * 2));
    }
  }

  public healPlayer(amount: number) {
    this.playerHealth = Math.min(this.maxPlayerHealth, this.playerHealth + amount);
  }

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
        
        GameEventBus.emit(GameEvents.THREAT_LEVEL_UP, { level: this.level });
    }
  }

  public tickReboot(amount: number) {
    if (this.playerHealth > 0) return;
    this.playerRebootProgress = Math.max(0, Math.min(100, this.playerRebootProgress + amount));
    if (this.playerRebootProgress >= 100) {
        this.playerHealth = this.maxPlayerHealth / 2;
        this.playerRebootProgress = 0;
    }
  }
}
