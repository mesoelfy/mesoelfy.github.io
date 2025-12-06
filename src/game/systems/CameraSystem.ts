import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { noise } from '../utils/Noise';

export class CameraSystem implements IGameSystem {
  public trauma = 0;
  private time = 0;
  
  // Configuration
  private readonly DECAY_RATE = 0.8; 
  private readonly MAX_OFFSET = 1.5; 
  private readonly MAX_ROTATION = 0.05; 
  private readonly NOISE_SPEED = 15.0; 

  setup(locator: IServiceLocator): void {
    this.setupListeners();
  }

  update(delta: number, time: number): void {
    this.time += delta;
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - (delta * this.DECAY_RATE));
    }
  }

  teardown(): void {}

  private setupListeners() {
    // MINOR SHAKE: Standard Player Hit (Collision)
    GameEventBus.subscribe(GameEvents.PLAYER_HIT, (p) => {
        // Hunter bullets/Munchers deal 10 dmg. Kamikazes deal 25 dmg.
        // FIX: Reduced minor hit trauma from 0.35 to 0.2 for tighter, shorter shake.
        const intensity = p.damage > 10 ? 0.6 : 0.2; 
        this.addTrauma(intensity);
    });

    // MAJOR SHAKE: Panel Destruction
    GameEventBus.subscribe(GameEvents.PANEL_DESTROYED, () => this.addTrauma(0.7));
    
    // CATASTROPHIC: Game Over
    GameEventBus.subscribe(GameEvents.GAME_OVER, () => this.addTrauma(1.0));
  }

  public addTrauma(amount: number) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  public getShake() {
    if (this.trauma <= 0) return { x: 0, y: 0, r: 0 };

    const shake = this.trauma * this.trauma;
    
    const x = this.MAX_OFFSET * shake * noise(this.time * this.NOISE_SPEED);
    const y = this.MAX_OFFSET * shake * noise((this.time * this.NOISE_SPEED) + 100);
    const r = this.MAX_ROTATION * shake * noise((this.time * this.NOISE_SPEED) + 200);

    return { x, y, r };
  }
}
