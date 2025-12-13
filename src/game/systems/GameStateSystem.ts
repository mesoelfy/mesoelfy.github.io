import { IGameSystem, IServiceLocator, IGameStateSystem } from '../core/interfaces';
import { PLAYER_CONFIG } from '../config/PlayerConfig';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { useStore } from '@/core/store/useStore'; 
import { AudioSystem } from '@/core/audio/AudioSystem';
import { PanelRegistry } from './PanelRegistrySystem';

export class GameStateSystem implements IGameStateSystem {
  public playerHealth: number = PLAYER_CONFIG.maxHealth;
  public maxPlayerHealth: number = PLAYER_CONFIG.maxHealth;
  public playerRebootProgress: number = 0;
  
  public score: number = 0;
  public xp: number = 0;
  public level: number = 1;
  public xpToNextLevel: number = PLAYER_CONFIG.baseXpRequirement;
  public upgradePoints: number = 0;

  public activeUpgrades: Record<string, number> = {
    'OVERCLOCK': 0, 'EXECUTE': 0, 'FORK': 0,
    'SNIFFER': 0, 'BACKDOOR': 0, 'REPAIR_NANITES': 0
  };

  public isGameOver: boolean = false;
  
  private heartbeatTimer: number = 0;

  setup(locator: IServiceLocator): void {
    this.reset();
    GameEventBus.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        this.applyUpgrade(p.option);
    });
  }

  update(delta: number, time: number): void {
      if (this.isGameOver) return;

      if (PanelRegistry.systemIntegrity < 30 && PanelRegistry.systemIntegrity > 0) {
          this.heartbeatTimer -= delta;
          
          if (this.heartbeatTimer <= 0) {
              const urgency = 1.0 - (PanelRegistry.systemIntegrity / 30);
              AudioSystem.playSound('loop_warning');
              GameEventBus.emit(GameEvents.HEARTBEAT, { urgency });
              this.heartbeatTimer = 1.4 - (urgency * 1.05); 
          }
      } else {
          this.heartbeatTimer = 0;
      }
  }

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
    this.activeUpgrades = { 
        'OVERCLOCK': 0, 'EXECUTE': 0, 'FORK': 0,
        'SNIFFER': 0, 'BACKDOOR': 0, 'REPAIR_NANITES': 0
    };
  }

  public applyUpgrade(option: string) {
      if (this.upgradePoints > 0) {
          this.upgradePoints--;
          if (option === 'PURGE' || option === 'RESTORE') return;
          if (option === 'DAEMON') {
              GameEventBus.emit(GameEvents.SPAWN_DAEMON, null);
              return; 
          }
          this.activeUpgrades[option] = (this.activeUpgrades[option] || 0) + 1;
          if (option === 'REPAIR_NANITES') this.healPlayer(this.maxPlayerHealth * 0.2);
      }
  }

  public damagePlayer(amount: number) {
    if (this.isGameOver) return;
    const { godMode } = useStore.getState().debugFlags;
    if (godMode) return;
    
    if (this.playerHealth > 0) {
        this.playerHealth = Math.max(0, this.playerHealth - amount);
        if (this.playerHealth <= 0) AudioSystem.playSound('fx_player_death');
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
        this.playerHealth = this.maxPlayerHealth; 
        this.playerRebootProgress = 0;
        AudioSystem.playSound('fx_reboot_success'); 
    }
  }

  public decayReboot(amount: number) {
      if (this.playerHealth > 0) return; 
      this.playerRebootProgress = Math.max(0, this.playerRebootProgress - amount);
  }
}
