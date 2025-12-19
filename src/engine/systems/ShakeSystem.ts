import { IGameSystem, IGameEventService, IFastEventService } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { noise } from '@/engine/math/Noise';
import { useStore } from '@/engine/state/global/useStore';

export class ShakeSystem implements IGameSystem {
  private trauma = 0;
  private time = 0;
  public currentOffset = { x: 0, y: 0, r: 0 };

  private readonly DECAY_RATE = 2.0; 
  
  // REDUCED INTENSITY CONSTANTS (Maintained from previous step)
  private readonly MAX_OFFSET_X = 0.2;  
  private readonly MAX_OFFSET_Y = 0.12; 
  private readonly MAX_ROTATION = 0.015; 
  
  private readonly BASE_SPEED = 15.0; 
  private readonly TRAUMA_SPEED_BOOST = 65.0; 
  private readonly PIXELS_PER_UNIT = 40; 
  
  private cleanupListeners: (() => void) | null = null;

  constructor(
      private events: IGameEventService,
      private fastEvents: IFastEventService
  ) {
    const unsub1 = this.events.subscribe(GameEvents.TRAUMA_ADDED, (p) => this.addTrauma(p.amount));
    const unsub2 = this.events.subscribe(GameEvents.PLAYER_HIT, (p) => {
        // INCREASED BASE SENSITIVITY
        // Was: > 10 ? 0.45 : 0.2
        // Now: > 5 ? 0.4 : 0.3
        // This ensures even small hits (1-3 dmg) register a 0.3 baseline trauma
        const amount = p.damage >= 5 ? 0.4 : 0.3;
        this.addTrauma(amount);
    });
    
    this.cleanupListeners = () => {
        unsub1();
        unsub2();
    };
  }

  update(delta: number, time: number): void {
    const strength = useStore.getState().screenShakeStrength;
    
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - (delta * this.DECAY_RATE));
    }

    const shake = (this.trauma * this.trauma) * strength;
    
    if (shake > 0.001) {
        const currentSpeed = this.BASE_SPEED + (this.trauma * this.TRAUMA_SPEED_BOOST);
        this.time += delta * currentSpeed;
        
        const x = this.MAX_OFFSET_X * shake * noise(this.time);
        const y = this.MAX_OFFSET_Y * shake * noise(this.time + 100);
        const r = this.MAX_ROTATION * shake * noise(this.time + 200);
        
        this.currentOffset = { x, y, r };

        const domX = -x * this.PIXELS_PER_UNIT;
        const domY = -y * this.PIXELS_PER_UNIT; 
        
        const root = document.documentElement;
        root.style.setProperty('--shake-x', `${domX.toFixed(2)}px`);
        root.style.setProperty('--shake-y', `${-domY.toFixed(2)}px`);
        root.style.setProperty('--shake-r', `${r.toFixed(4)}rad`);
    } else {
        if (this.currentOffset.x !== 0) {
            this.resetDOM();
        }
    }
  }

  public addTrauma(amount: number) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  private resetDOM() {
      this.currentOffset = { x: 0, y: 0, r: 0 };
      const root = document.documentElement;
      root.style.setProperty('--shake-x', '0px');
      root.style.setProperty('--shake-y', '0px');
      root.style.setProperty('--shake-r', '0rad');
  }

  teardown(): void {
    if (this.cleanupListeners) this.cleanupListeners();
    this.resetDOM();
  }
}
