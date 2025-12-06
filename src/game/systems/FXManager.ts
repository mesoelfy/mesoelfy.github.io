import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { ServiceLocator } from '../core/ServiceLocator';
import { TimeSystem } from './TimeSystem';
import { CameraSystem } from './CameraSystem';

class FXManagerController {
  private initialized = false;
  
  public init() {
    if (this.initialized) return;
    
    // --- HIT STOP & TRAUMA EVENTS ---
    
    // 1. PANEL DESTROYED (Major Impact)
    GameEventBus.subscribe(GameEvents.PANEL_DESTROYED, () => {
        this.addTrauma(0.7);
        this.triggerHitStop(0.15); // 150ms Freeze
    });
    
    // 2. PLAYER HIT (Medium Impact)
    GameEventBus.subscribe(GameEvents.PLAYER_HIT, (p) => {
        const isBig = p.damage > 10;
        this.addTrauma(isBig ? 0.6 : 0.3);
        if (isBig) this.triggerHitStop(0.1); // 100ms Freeze on big hits
    });
    
    // 3. GAME OVER (Catastrophic)
    GameEventBus.subscribe(GameEvents.GAME_OVER, () => {
        this.addTrauma(1.0);
        this.triggerHitStop(0.5); // 500ms Freeze
    });

    // 4. BOSS DEATH (Placeholder Comment)
    // GameEventBus.subscribe(GameEvents.BOSS_DEATH, () => {
    //    this.addTrauma(1.0);
    //    this.triggerHitStop(1.0); // 1 Second dramatic pause
    // });
    
    this.initialized = true;
  }

  public addTrauma(amount: number) {
    try {
        const cam = ServiceLocator.getSystem<CameraSystem>('CameraSystem');
        cam.addTrauma(amount);
    } catch {}
  }

  private triggerHitStop(duration: number) {
    try {
        const time = ServiceLocator.getSystem<TimeSystem>('TimeSystem');
        time.freeze(duration);
    } catch {}
  }
}

export const FXManager = new FXManagerController();
