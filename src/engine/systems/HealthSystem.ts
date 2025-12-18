import { IGameSystem, IGameEventService, IAudioService, IPanelSystem, IFastEventService } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { PLAYER_CONFIG } from '@/engine/config/PlayerConfig';
import { useStore } from '@/engine/state/global/useStore';
import { FastEvents } from '@/engine/signals/FastEventBus';
import { ServiceLocator } from '@/engine/services/ServiceLocator';

export class HealthSystem implements IGameSystem {
  public playerHealth: number = PLAYER_CONFIG.maxHealth;
  public maxPlayerHealth: number = PLAYER_CONFIG.maxHealth;
  public playerRebootProgress: number = 0;
  public isGameOver: boolean = false;
  
  private fastEvents: IFastEventService;
  private readCursor = 0;

  constructor(
    private events: IGameEventService,
    private audio: IAudioService,
    private panelSystem: IPanelSystem
  ) {
    this.fastEvents = ServiceLocator.getFastEventBus();
    this.readCursor = this.fastEvents.getCursor();
    this.reset();
    
    this.events.subscribe(GameEvents.PLAYER_REBOOT_TICK, (p) => {
        this.tickReboot(p.amount);
    });

    this.events.subscribe(GameEvents.PLAYER_REBOOT_DECAY, (p) => {
        this.decayReboot(p.amount);
    });
  }

  update(delta: number, time: number): void {
    // Process Fast Events
    this.readCursor = this.fastEvents.readEvents(this.readCursor, (id, a1) => {
        if (id === FastEvents.PLAYER_HIT) {
            this.damagePlayer(a1); // a1 = damage amount
            // Re-emit slow event for UI/Logs
            this.events.emit(GameEvents.PLAYER_HIT, { damage: a1 });
        }
    });

    if (this.isGameOver) return;
    
    if (this.panelSystem.systemIntegrity <= 0) {
        this.isGameOver = true;
        this.events.emit(GameEvents.GAME_OVER, { score: 0 });
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
      this.readCursor = this.fastEvents ? this.fastEvents.getCursor() : 0;
  }

  teardown(): void {}
}
