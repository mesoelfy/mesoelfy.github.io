import { IGameSystem, IServiceLocator, IGameEventService, IAudioService, IPanelSystem } from '@/core/interfaces';
import { GameEvents } from '@/core/signals/GameEvents';
import { PLAYER_CONFIG } from '@/game/config/PlayerConfig';
import { useStore } from '@/game/state/global/useStore';

export class HealthSystem implements IGameSystem {
  public playerHealth: number = PLAYER_CONFIG.maxHealth;
  public maxPlayerHealth: number = PLAYER_CONFIG.maxHealth;
  public playerRebootProgress: number = 0;
  public isGameOver: boolean = false;

  private events!: IGameEventService;
  private audio!: IAudioService;
  private panelSystem!: IPanelSystem;

  setup(locator: IServiceLocator): void {
    this.events = locator.getGameEventBus();
    this.audio = locator.getAudioService();
    this.panelSystem = locator.getSystem<IPanelSystem>('PanelRegistrySystem');
    this.reset();
  }

  update(delta: number, time: number): void {
    if (this.isGameOver) return;
    
    // Check Panel Integrity for Game Over
    if (this.panelSystem.systemIntegrity <= 0) {
        this.isGameOver = true;
        this.events.emit(GameEvents.GAME_OVER, { score: 0 }); // Score handled elsewhere
        this.events.emit(GameEvents.TRAUMA_ADDED, { amount: 1.0 });
    }
  }

  public damagePlayer(amount: number) {
    if (this.isGameOver) return;
    const { godMode } = useStore.getState().debugFlags;
    if (godMode) return;
    
    if (this.playerHealth > 0) {
        this.playerHealth = Math.max(0, this.playerHealth - amount);
        if (this.playerHealth <= 0) this.audio.playSound('fx_player_death');
    } else {
        this.playerRebootProgress = Math.max(0, this.playerRebootProgress - (amount * 2));
    }
  }

  public healPlayer(amount: number) {
    this.playerHealth = Math.min(this.maxPlayerHealth, this.playerHealth + amount);
  }

  public tickReboot(amount: number) {
    if (this.playerHealth > 0) return;
    this.playerRebootProgress = Math.max(0, Math.min(100, this.playerRebootProgress + amount));
    
    if (this.playerRebootProgress >= 100) {
        this.playerHealth = this.maxPlayerHealth; 
        this.playerRebootProgress = 0;
        this.audio.playSound('fx_reboot_success'); 
    }
  }

  public decayReboot(amount: number) {
      if (this.playerHealth > 0) return; 
      this.playerRebootProgress = Math.max(0, this.playerRebootProgress - amount);
  }

  public reset() {
      this.playerHealth = this.maxPlayerHealth;
      this.playerRebootProgress = 0;
      this.isGameOver = false;
  }

  teardown(): void {}
}
