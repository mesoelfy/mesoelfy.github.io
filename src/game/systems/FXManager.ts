// src/game/systems/FXManager.ts
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../config/Identifiers';

class FXManagerController {
  private initialized = false;
  
  public trauma = 0;

  public init() {
    if (this.initialized) return;
    
    // --- EVENT WIRING ---
    
    GameEventBus.subscribe(GameEvents.PANEL_DESTROYED, () => {
        this.addTrauma(0.55);
    });
    
    GameEventBus.subscribe(GameEvents.PLAYER_HIT, () => {
        this.addTrauma(0.35);
    });
    
    this.initialized = true;
  }

  public addTrauma(amount: number) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  public decay(delta: number) {
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - (delta * 0.8));
    }
  }
}

export const FXManager = new FXManagerController();
