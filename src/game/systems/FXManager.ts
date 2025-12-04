// src/game/systems/FXManager.ts
import { GameEventBus } from '../events/GameEventBus';

class FXManagerController {
  private initialized = false;
  
  // A value between 0 and 1 representing "Chaos"
  public trauma = 0;

  public init() {
    if (this.initialized) return;
    
    // --- EVENT WIRING ---
    
    // 1. Panel Offline (Major Shake)
    GameEventBus.subscribe('PANEL_DESTROYED', () => {
        this.addTrauma(0.55);
    });
    
    // 2. Player Hit (Gentle Shake)
    GameEventBus.subscribe('PLAYER_HIT', () => {
        this.addTrauma(0.35);
    });

    // 3. Boss Death (Placeholder)
    // GameEventBus.subscribe('BOSS_DIED', () => this.addTrauma(0.7));
    
    this.initialized = true;
  }

  public addTrauma(amount: number) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  public decay(delta: number) {
    if (this.trauma > 0) {
      // Decay speed: 0.8 per second (fully calm in ~1.2s)
      this.trauma = Math.max(0, this.trauma - (delta * 0.8));
    }
  }
}

export const FXManager = new FXManagerController();
