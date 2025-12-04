// src/game/systems/FXManager.ts
import { GameEventBus } from '../events/GameEventBus';
import { GameEventType } from '../events/GameEvents';

class FXManagerController {
  private initialized = false;

  public init() {
    if (this.initialized) return;
    
    console.log("Creating FX Manager Subscribers...");

    // WIRE UP EVENT LISTENERS HERE
    // This allows us to add Screen Shake or Particles without touching GameEngine.ts
    
    GameEventBus.subscribe('ENEMY_DESTROYED', (payload) => {
      // TODO: Spawn explosion particles at payload.x, payload.y
      // TODO: Trigger small screen shake
      console.log(`[FX] Enemy Destroyed: ${payload.type}`);
    });

    GameEventBus.subscribe('PANEL_DAMAGED', (payload) => {
      // TODO: Trigger glitch effect on panel
      // TODO: Play damage sound
      console.log(`[FX] Panel Damaged: ${payload.id}`);
    });

    GameEventBus.subscribe('PLAYER_FIRED', () => {
      // TODO: Play laser sound
    });

    this.initialized = true;
  }
}

export const FXManager = new FXManagerController();
