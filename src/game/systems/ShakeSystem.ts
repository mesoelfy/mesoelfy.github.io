import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { noise } from '../utils/Noise';
import { useStore } from '@/core/store/useStore';

export class ShakeSystem implements IGameSystem {
  private trauma = 0;
  private time = 0;
  
  // Public read-only state for Renderers
  public currentOffset = { x: 0, y: 0, r: 0 };

  // Configuration
  private readonly DECAY_RATE = 1.5; // Trauma drains fast
  private readonly MAX_OFFSET_X = 1.0; // World Units
  private readonly MAX_OFFSET_Y = 1.0;
  private readonly MAX_ROTATION = 0.05; // Radians (~3 degrees)
  private readonly NOISE_SPEED = 20.0; 
  private readonly PIXELS_PER_UNIT = 40; // Approx zoom scale for DOM sync

  setup(locator: IServiceLocator): void {
    this.setupListeners();
  }

  update(delta: number, time: number): void {
    const strength = useStore.getState().screenShakeStrength;
    
    // 1. Decay Trauma
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - (delta * this.DECAY_RATE));
    }

    // 2. Calculate Shake (Trauma^2 or Trauma^3 for "Juice")
    const shake = (this.trauma * this.trauma) * strength;
    
    if (shake > 0.001) {
        this.time += delta * this.NOISE_SPEED;
        
        // 3D Noise Sampling (Seed offsets: 0, 100, 200)
        const x = this.MAX_OFFSET_X * shake * noise(this.time);
        const y = this.MAX_OFFSET_Y * shake * noise(this.time + 100);
        const r = this.MAX_ROTATION * shake * noise(this.time + 200);
        
        this.currentOffset = { x, y, r };

        // 3. Sync to DOM (Global CSS Vars)
        // We invert X/Y because if Camera moves Right (+), World moves Left (-).
        // But if we translate DOM Right (+), UI moves Right (+).
        // To match "World Shake", if Cam moves +X, World moves -X. 
        // So DOM should also move -X (translate negative).
        // Scale by 40 to match Viewport zoom.
        const domX = -x * this.PIXELS_PER_UNIT;
        const domY = -y * this.PIXELS_PER_UNIT; // +Y is Up in 3D, Down in DOM. Invert again? 
        // 3D +Y moves Camera Up -> World moves Down.
        // DOM +Y translates Down. So they match direction naturally if we invert.
        
        const root = document.documentElement;
        root.style.setProperty('--shake-x', `${domX.toFixed(2)}px`);
        root.style.setProperty('--shake-y', `${-domY.toFixed(2)}px`); // Y is inverted in DOM vs 3D
        root.style.setProperty('--shake-r', `${r.toFixed(4)}rad`);
    } else {
        // Reset to exact zero to stop micro-jitters
        if (this.currentOffset.x !== 0) {
            this.currentOffset = { x: 0, y: 0, r: 0 };
            const root = document.documentElement;
            root.style.setProperty('--shake-x', '0px');
            root.style.setProperty('--shake-y', '0px');
            root.style.setProperty('--shake-r', '0rad');
        }
    }
  }

  private setupListeners() {
    GameEventBus.subscribe(GameEvents.TRAUMA_ADDED, (p) => this.addTrauma(p.amount));
    
    // Fallbacks just in case (though FXManager usually calls TRAUMA_ADDED now)
    GameEventBus.subscribe(GameEvents.PLAYER_HIT, (p) => {
        const amount = p.damage > 10 ? 0.6 : 0.3;
        this.addTrauma(amount);
    });
  }

  public addTrauma(amount: number) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  teardown(): void {
    const root = document.documentElement;
    root.style.removeProperty('--shake-x');
    root.style.removeProperty('--shake-y');
    root.style.removeProperty('--shake-r');
  }
}
