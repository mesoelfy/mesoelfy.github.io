import { IGameSystem, IGameEventService, IAudioService, IPanelSystem } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { PLAYER_CONFIG } from '@/engine/config/PlayerConfig';
import { useStore } from '@/engine/state/global/useStore';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { GameStream } from '@/engine/state/GameStream';

export class HealthSystem implements IGameSystem {
  public playerHealth: number = PLAYER_CONFIG.maxHealth;
  public maxPlayerHealth: number = PLAYER_CONFIG.maxHealth;
  public playerRebootProgress: number = 0;
  public isGameOver: boolean = false;
  
  constructor(
    private events: IGameEventService,
    private audio: IAudioService,
    private panelSystem: IPanelSystem
  ) {
    this.reset();
    
    this.events.subscribe(GameEvents.PLAYER_REBOOT_TICK, (p) => this.tickReboot(p.amount));
    this.events.subscribe(GameEvents.PLAYER_REBOOT_DECAY, (p) => this.decayReboot(p.amount));
    this.events.subscribe(GameEvents.PLAYER_HIT, (p) => {
        this.damagePlayer(p.damage);
    });
  }

  update(delta: number, time: number): void {
    if (this.isGameOver) return;
    
    if (this.panelSystem.systemIntegrity <= 0) {
        this.isGameOver = true;
        this.events.emit(GameEvents.GAME_OVER, { score: 0 });
        this.events.emit(GameEvents.TRAUMA_ADDED, { amount: 1.0 });
        
        // Critical State Update
        useGameStore.setState({ systemIntegrity: 0 });
        GameStream.set('SYSTEM_INTEGRITY', 0);
    }
  }

  public damagePlayer(amount: number) {
    if (this.isGameOver) return;
    const { godMode } = useStore.getState().debugFlags;
    if (godMode) return;
    
    if (this.playerHealth > 0) {
        this.playerHealth = Math.max(0, this.playerHealth - amount);
        
        // 1. Direct Stream Update (Fast UI)
        GameStream.set('PLAYER_HEALTH', this.playerHealth);
        
        // 2. Store Persistence (Slow State)
        useGameStore.setState({ playerHealth: this.playerHealth });
        
        if (this.playerHealth <= 0) {
            this.audio.playSound('fx_player_death');
        }
    } else {
        this.playerRebootProgress = Math.max(0, this.playerRebootProgress - (amount * 2));
        
        GameStream.set('PLAYER_REBOOT', this.playerRebootProgress);
        useGameStore.setState({ playerRebootProgress: this.playerRebootProgress });
    }
  }

  public healPlayer(amount: number) {
    this.playerHealth = Math.min(this.maxPlayerHealth, this.playerHealth + amount);
    
    GameStream.set('PLAYER_HEALTH', this.playerHealth);
    useGameStore.setState({ playerHealth: this.playerHealth });
  }

  public tickReboot(amount: number) {
    if (this.playerHealth > 0) return;
    this.playerRebootProgress = Math.max(0, Math.min(100, this.playerRebootProgress + amount));
    
    GameStream.set('PLAYER_REBOOT', this.playerRebootProgress);
    useGameStore.setState({ playerRebootProgress: this.playerRebootProgress });
    
    if (this.playerRebootProgress >= 100) {
        this.playerHealth = this.maxPlayerHealth; 
        this.playerRebootProgress = 0;
        this.audio.playSound('fx_reboot_success');
        
        GameStream.set('PLAYER_HEALTH', this.playerHealth);
        GameStream.set('PLAYER_REBOOT', 0);
        
        useGameStore.setState({ 
            playerHealth: this.playerHealth, 
            playerRebootProgress: 0 
        });
    }
  }

  public decayReboot(amount: number) {
      if (this.playerHealth > 0) return; 
      this.playerRebootProgress = Math.max(0, this.playerRebootProgress - amount);
      
      GameStream.set('PLAYER_REBOOT', this.playerRebootProgress);
      useGameStore.setState({ playerRebootProgress: this.playerRebootProgress });
  }

  public reset() {
      this.playerHealth = this.maxPlayerHealth;
      this.playerRebootProgress = 0;
      this.isGameOver = false;
      
      // Reset Stream
      GameStream.set('PLAYER_HEALTH', this.maxPlayerHealth);
      GameStream.set('PLAYER_MAX_HEALTH', this.maxPlayerHealth);
      GameStream.set('PLAYER_REBOOT', 0);
      GameStream.set('SYSTEM_INTEGRITY', 100);
      
      useGameStore.setState({ 
          playerHealth: this.maxPlayerHealth,
          playerRebootProgress: 0,
          systemIntegrity: 100 
      });
  }

  teardown(): void {}
}
