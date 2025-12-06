import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { PLAYER_CONFIG } from '../config/PlayerConfig';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';

export class GameStateSystem implements IGameSystem {
  // Player Stats
  public playerHealth: number = PLAYER_CONFIG.maxHealth;
  public maxPlayerHealth: number = PLAYER_CONFIG.maxHealth;
  public playerRebootProgress: number = 0;
  
  // Progression
  public score: number = 0;
  public xp: number = 0;
  public level: number = 1;
  public xpToNextLevel: number = PLAYER_CONFIG.baseXpRequirement;
  public upgradePoints: number = 0;
  public activeUpgrades: Record<string, number> = {
    'RAPID_FIRE': 0, 'MULTI_SHOT': 0, 'SPEED_UP': 0, 'REPAIR_NANITES': 0
  };

  // Meta
  public isGameOver: boolean = false;

  setup(locator: IServiceLocator): void {
    this.reset();
  }

  update(delta: number, time: number): void {
    // Logic like passive regen or buff timers could go here
  }

  teardown(): void {
    // Data persists in instance until explicit reset
  }

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

  // --- ACTIONS ---

  public damagePlayer(amount: number) {
    if (this.isGameOver) return;
    
    if (this.playerHealth > 0) {
        this.playerHealth = Math.max(0, this.playerHealth - amount);
        if (this.playerHealth <= 0) {
           // Player just died, but game isn't over (Reboot phase)
        }
    } else {
        // Damage reboot progress if already down
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
    }
  }

  public tickReboot(amount: number) {
    if (this.playerHealth > 0) return;
    
    this.playerRebootProgress = Math.max(0, Math.min(100, this.playerRebootProgress + amount));
    
    if (this.playerRebootProgress >= 100) {
        // REVIVED!
        this.playerHealth = this.maxPlayerHealth / 2;
        this.playerRebootProgress = 0;
    }
  }
}
