import { IGameSystem, IServiceLocator } from '@/engine/interfaces';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { noise } from '@/engine/math/Noise';
import { useStore } from '@/core/store/useStore';

export class ShakeSystem implements IGameSystem {
  private trauma = 0;
  private time = 0;
  
  public currentOffset = { x: 0, y: 0, r: 0 };

  // --- CONFIGURATION ---
  // Decay: How fast it settles. 2.0 is snappy but allows a brief "fade out".
  private readonly DECAY_RATE = 2.0; 
  
  // Amplitude: Maximum distance in World Units at 100% Trauma
  // BIASED X-AXIS: 0.5 vs 0.3 creates more horizontal "jitter"
  private readonly MAX_OFFSET_X = 0.5; 
  private readonly MAX_OFFSET_Y = 0.3; 
  private readonly MAX_ROTATION = 0.04; 

  // Frequency: The speed of the noise sampling
  private readonly BASE_SPEED = 15.0;  // Slow wobble for small hits
  private readonly TRAUMA_SPEED_BOOST = 65.0; // Adds violence to big hits

  private readonly PIXELS_PER_UNIT = 40; 

  setup(locator: IServiceLocator): void {
    this.setupListeners();
  }

  update(delta: number, time: number): void {
    const strength = useStore.getState().screenShakeStrength;
    
    // 1. Decay Trauma
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - (delta * this.DECAY_RATE));
    }

    // 2. Calculate "Shake Juice" (Trauma^2)
    const shake = (this.trauma * this.trauma) * strength;
    
    if (shake > 0.001) {
        // 3. DYNAMIC FREQUENCY
        // As trauma increases, the noise sample steps faster (Higher Hz)
        // At 0.0 Trauma: Speed is 15.0 (Gentle)
        // At 1.0 Trauma: Speed is 80.0 (Violent Buzz)
        const currentSpeed = this.BASE_SPEED + (this.trauma * this.TRAUMA_SPEED_BOOST);
        
        this.time += delta * currentSpeed;
        
        // 4. Sample Noise (Seed offsets: 0, 100, 200)
        // Multiplied by 'shake' amplitude
        const x = this.MAX_OFFSET_X * shake * noise(this.time);
        const y = this.MAX_OFFSET_Y * shake * noise(this.time + 100);
        const r = this.MAX_ROTATION * shake * noise(this.time + 200);
        
        this.currentOffset = { x, y, r };

        // 5. DOM Sync
        const domX = -x * this.PIXELS_PER_UNIT;
        const domY = -y * this.PIXELS_PER_UNIT; 
        
        const root = document.documentElement;
        root.style.setProperty('--shake-x', `${domX.toFixed(2)}px`);
        root.style.setProperty('--shake-y', `${-domY.toFixed(2)}px`);
        root.style.setProperty('--shake-r', `${r.toFixed(4)}rad`);
    } else {
        // Reset
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
    
    // Fallbacks
    GameEventBus.subscribe(GameEvents.PLAYER_HIT, (p) => {
        const amount = p.damage > 10 ? 0.45 : 0.2;
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
