import { IGameSystem, IParticleSystem, IGameEventService, IFastEventService } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { ShakeSystem } from './ShakeSystem';
import { VFX_RECIPES } from '@/engine/config/VFXConfig';
import { FastEvents, FX_ID_MAP } from '@/engine/signals/FastEventBus';
import { useStore } from '@/engine/state/global/useStore';

export class VFXSystem implements IGameSystem {
  private readCursor = 0;

  constructor(
    private particleSystem: IParticleSystem,
    private shakeSystem: ShakeSystem,
    private events: IGameEventService,
    private fastEvents: IFastEventService
  ) {
    this.readCursor = this.fastEvents.getCursor();
    this.setupListeners();
  }

  update(delta: number, time: number): void {
    this.readCursor = this.fastEvents.readEvents(this.readCursor, (id, a1, a2, a3, a4) => {
        if (id === FastEvents.SPAWN_FX) {
            const key = FX_ID_MAP[a1];
            if (key) this.executeRecipe(key, a2, a3, a4);
        }
        else if (id === FastEvents.TRAUMA) {
            this.addTrauma(a1);
        }
        else if (id === FastEvents.SPAWN_IMPACT) {
            // a1=x, a2=y, a3=packedColor, a4=angle
            this.spawnDynamicImpact(a1, a2, a3, a4); 
        }
    });
  }

  teardown(): void {}

  private setupListeners() {
    this.events.subscribe(GameEvents.PLAYER_HIT, (p) => {
        const isBig = p.damage > 10;
        if (isBig) this.triggerHitStop(0.05);
    });

    this.events.subscribe(GameEvents.PANEL_DESTROYED, () => {
        this.addTrauma(0.75); 
        this.triggerHitStop(0.1); 
    });

    this.events.subscribe(GameEvents.GAME_OVER, () => {
        this.addTrauma(1.0);
        this.triggerHitStop(0.5); 
    });
    
    this.events.subscribe(GameEvents.ZEN_MODE_ENABLED, () => {
        this.executeRecipe('PURGE_BLAST', 0, 0);
    });
  }

  private spawnDynamicImpact(x: number, y: number, packedColor: number, impactAngle: number) {
      // Unpack Color
      const r = ((packedColor >> 16) & 255) / 255;
      const g = ((packedColor >> 8) & 255) / 255;
      const b = (packedColor & 255) / 255;
      
      const toHex = (n: number) => Math.floor(n * 255).toString(16).padStart(2, '0');
      const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      
      const count = this.randomRange(2, 3);
      
      for(let i=0; i<count; i++) {
          // --- RICOCHET LOGIC ---
          const side = Math.random() > 0.5 ? 1 : -1;
          const deflection = 0.6 + (Math.random() * 1.2);
          const angle = impactAngle + (side * deflection);
          
          // KAMIKAZE PHYSICS PROFILE:
          // High Speed (10-22) + Long Life (0.6-1.0)
          // This allows Friction (0.95) to stop them mid-air before they die.
          const speed = this.randomRange(10, 22); 
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;
          const life = this.randomRange(0.1, 0.3);
          
          this.particleSystem.spawn(x, y, hex, vx, vy, life, 1.0); 
      }
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
          
          let size = 1.0;
          if (recipe.size) {
              size = this.randomRange(recipe.size[0], recipe.size[1]);
          }
          
          let vx = 0;
          let vy = 0;

          const isBackblast = recipe.omniChance && Math.random() < recipe.omniChance;
          const isDirectional = recipe.pattern === 'DIRECTIONAL';
          
          const finalSpeed = (isDirectional && isBackblast) ? speed * 0.5 : speed;
          const finalLife = (isDirectional && isBackblast) ? life * 0.8 : life;

          if (recipe.pattern === 'RADIAL') {
              const a = Math.random() * Math.PI * 2;
              vx = Math.cos(a) * finalSpeed;
              vy = Math.sin(a) * finalSpeed;
          } 
          else if (isDirectional) {
              let dir = angle + Math.PI; 
              let spread = recipe.spread || 0.5;

              if (isBackblast) {
                  dir += Math.PI; 
                  spread *= 1.5; 
              }

              const a = dir + (Math.random() - 0.5) * spread;
              vx = Math.cos(a) * finalSpeed;
              vy = Math.sin(a) * finalSpeed;
          }

          const shape = recipe.shape || 0;
          this.particleSystem.spawn(x, y, color, vx, vy, finalLife, size, shape);
      }
  }

  private randomRange(min: number, max: number) {
      return min + Math.random() * (max - min);
  }

  private addTrauma(amount: number) {
      this.shakeSystem.addTrauma(amount);
  }

  private triggerHitStop(duration: number) {}
}
