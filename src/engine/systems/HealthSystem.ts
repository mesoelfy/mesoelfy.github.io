import { IGameSystem, IGameEventService, IAudioService, IPanelSystem, IFastEventService } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { PLAYER_CONFIG } from '@/engine/config/PlayerConfig';
import { useStore } from '@/engine/state/global/useStore';
import { FastEvents } from '@/engine/signals/FastEventBus';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { TransientDOMService } from '@/engine/services/TransientDOMService';
import { useGameStore } from '@/engine/state/game/useGameStore';

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
            this.events.emit(GameEvents.PLAYER_HIT, { damage: a1 });
        }
    });

    if (this.isGameOver) return;
    
    if (this.panelSystem.systemIntegrity <= 0) {
        this.isGameOver = true;
        this.events.emit(GameEvents.GAME_OVER, { score: 0 });
        this.events.emit(GameEvents.TRAUMA_ADDED, { amount: 1.0 });
        
        // Sync final state to React
        useGameStore.setState({ systemIntegrity: 0 });
    }
  }

  public damagePlayer(amount: number) {
    if (this.isGameOver) return;
    const { godMode } = useStore.getState().debugFlags;
    if (godMode) return;
    
    if (this.playerHealth > 0) {
        this.playerHealth = Math.max(0, this.playerHealth - amount);
        this.updateVisuals();
        
        if (this.playerHealth <= 0) {
            this.audio.playSound('fx_player_death');
            useGameStore.setState({ playerHealth: 0 }); // Trigger React "Dead" state once
        }
    } else {
        this.playerRebootProgress = Math.max(0, this.playerRebootProgress - (amount * 2));
    }
  }

  public healPlayer(amount: number) {
    this.playerHealth = Math.min(this.maxPlayerHealth, this.playerHealth + amount);
    this.updateVisuals();
    // If we revived from 0, notify store
    if (this.playerHealth > 0 && useGameStore.getState().playerHealth <= 0) {
        useGameStore.setState({ playerHealth: this.playerHealth });
    }
  }

  public tickReboot(amount: number) {
    if (this.playerHealth > 0) return;
    this.playerRebootProgress = Math.max(0, Math.min(100, this.playerRebootProgress + amount));
    useGameStore.setState({ playerRebootProgress: this.playerRebootProgress }); // Sync for UI feedback
    
    if (this.playerRebootProgress >= 100) {
        this.playerHealth = this.maxPlayerHealth; 
        this.playerRebootProgress = 0;
        this.audio.playSound('fx_reboot_success');
        this.updateVisuals();
        useGameStore.setState({ playerHealth: this.playerHealth, playerRebootProgress: 0 });
    }
  }

  public decayReboot(amount: number) {
      if (this.playerHealth > 0) return; 
      this.playerRebootProgress = Math.max(0, this.playerRebootProgress - amount);
      // Optional: Throttle this sync if it causes lag, but reboot decay is visual
      if (Math.random() > 0.5) useGameStore.setState({ playerRebootProgress: this.playerRebootProgress });
  }

  private updateVisuals() {
      const hpPercent = this.playerHealth / this.maxPlayerHealth;
      TransientDOMService.update('hp-progress', hpPercent);
      
      let hpColor = '#78F654'; 
      if (hpPercent < 0.3) hpColor = '#FF003C'; 
      else if (hpPercent < 0.6) hpColor = '#eae747'; 
      if (this.playerHealth <= 0) hpColor = '#eae747'; // Reboot indicator

      TransientDOMService.update('hp-color', hpColor);
  }

  public reset() {
      this.playerHealth = this.maxPlayerHealth;
      this.playerRebootProgress = 0;
      this.isGameOver = false;
      this.readCursor = this.fastEvents ? this.fastEvents.getCursor() : 0;
      this.updateVisuals();
      
      // Reset React Store State
      useGameStore.setState({ 
          playerHealth: this.maxPlayerHealth,
          playerRebootProgress: 0,
          systemIntegrity: 100 
      });
  }

  teardown(): void {}
}
