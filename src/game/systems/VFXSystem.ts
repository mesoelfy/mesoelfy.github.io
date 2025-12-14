import { IGameSystem, IServiceLocator, IParticleSystem } from '../core/interfaces';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { ShakeSystem } from './ShakeSystem';
import { TimeSystem } from './TimeSystem';
import { VFX_RECIPES } from '../config/VFXConfig';
import { FastEventBus, FastEvents, FX_ID_MAP } from '../core/FastEventBus';
import { useStore } from '@/core/store/useStore';

export class VFXSystem implements IGameSystem {
  private particleSystem!: IParticleSystem;
  private locator!: IServiceLocator;
  
  // Local Event Cursor
  private readCursor = 0;

  setup(locator: IServiceLocator): void {
    this.locator = locator;
    this.particleSystem = locator.getParticleSystem();
    
    // Sync cursor to start (ignore old events)
    this.readCursor = FastEventBus.getCursor();
    
    this.setupListeners();
  }

  update(delta: number, time: number): void {
    // Read and update local cursor
    this.readCursor = FastEventBus.readEvents(this.readCursor, (id, a1, a2, a3, a4) => {
        if (id === FastEvents.SPAWN_FX) {
            const key = FX_ID_MAP[a1];
            if (key) this.executeRecipe(key, a2, a3, a4);
        }
        else if (id === FastEvents.TRAUMA) {
            this.addTrauma(a1);
        }
    });
  }

  teardown(): void {}

  private setupListeners() {
    GameEventBus.subscribe(GameEvents.PLAYER_HIT, (p) => {
        const isBig = p.damage > 10;
        if (isBig) this.triggerHitStop(0.05);
    });

    GameEventBus.subscribe(GameEvents.PANEL_DESTROYED, () => {
        this.addTrauma(0.75); 
        this.triggerHitStop(0.1); 
    });

    GameEventBus.subscribe(GameEvents.GAME_OVER, () => {
        this.addTrauma(1.0);
        this.triggerHitStop(0.5); 
    });
    
    GameEventBus.subscribe(GameEvents.ZEN_MODE_ENABLED, () => {
        this.executeRecipe('PURGE_BLAST', 0, 0);
    });
  }

  private executeRecipe(key: string, x: number, y: number, angle: number = 0) {
      const recipe = VFX_RECIPES[key];
      if (!recipe) return;

      const graphicsMode = useStore.getState().graphicsMode;
      const isPotato = graphicsMode === 'POTATO';
      const multiplier = isPotato ? 0.3 : 1.0;

      const rawCount = this.randomRange(recipe.count[0], recipe.count[1]);
      let count = Math.floor(rawCount * multiplier);
      
      if (rawCount > 0 && count === 0) count = 1;

      for (let i = 0; i < count; i++) {
          const color = recipe.colors[Math.floor(Math.random() * recipe.colors.length)];
          const speed = this.randomRange(recipe.speed[0], recipe.speed[1]);
          const life = this.randomRange(recipe.life[0], recipe.life[1]);
          
          let vx = 0;
          let vy = 0;

          if (recipe.pattern === 'RADIAL') {
              const a = Math.random() * Math.PI * 2;
              vx = Math.cos(a) * speed;
              vy = Math.sin(a) * speed;
          } 
          else if (recipe.pattern === 'DIRECTIONAL') {
              const baseDir = angle + Math.PI; 
              const spread = recipe.spread || 0.5;
              const a = baseDir + (Math.random() - 0.5) * spread;
              vx = Math.cos(a) * speed;
              vy = Math.sin(a) * speed;
          }

          this.particleSystem.spawn(x, y, color, vx, vy, life);
      }
  }

  private randomRange(min: number, max: number) {
      return min + Math.random() * (max - min);
  }

  private addTrauma(amount: number) {
      try {
          const shake = this.locator.getSystem<ShakeSystem>('ShakeSystem');
          shake.addTrauma(amount);
      } catch {}
  }

  private triggerHitStop(duration: number) {
      try {
          const time = this.locator.getSystem<TimeSystem>('TimeSystem');
          time.freeze(duration);
      } catch {}
  }
}
