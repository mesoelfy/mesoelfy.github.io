import { IGameSystem, IGameEventService, IFastEventService } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { noise } from '@/engine/math/Noise';
import { useStore } from '@/engine/state/global/useStore';
import { VISUAL_CONFIG } from '@/engine/config/VisualConfig';

export class ShakeSystem implements IGameSystem {
  private trauma = 0;
  private time = 0;
  public currentOffset = { x: 0, y: 0, r: 0 };
  
  private cleanupListeners: (() => void) | null = null;

  constructor(
      private events: IGameEventService,
      private fastEvents: IFastEventService
  ) {
    const unsub1 = this.events.subscribe(GameEvents.TRAUMA_ADDED, (p) => this.addTrauma(p.amount));
    const unsub2 = this.events.subscribe(GameEvents.PLAYER_HIT, (p) => {
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
    const CFG = VISUAL_CONFIG.SHAKE;
    
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - (delta * CFG.DECAY_RATE));
    }

    const shake = (this.trauma * this.trauma) * strength;
    
    if (shake > 0.001) {
        const currentSpeed = CFG.BASE_SPEED + (this.trauma * CFG.TRAUMA_SPEED_BOOST);
        this.time += delta * currentSpeed;
        
        const x = CFG.MAX_OFFSET_X * shake * noise(this.time);
        const y = CFG.MAX_OFFSET_Y * shake * noise(this.time + 100);
        const r = CFG.MAX_ROTATION * shake * noise(this.time + 200);
        
        this.currentOffset = { x, y, r };

        const domX = -x * CFG.PIXELS_PER_UNIT;
        const domY = -y * CFG.PIXELS_PER_UNIT; 
        
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
