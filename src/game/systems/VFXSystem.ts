import { IGameSystem, IServiceLocator, IEntitySpawner } from '../core/interfaces';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { ShakeSystem } from './ShakeSystem';
import { TimeSystem } from './TimeSystem';
import { VFX_RECIPES } from '../config/VFXConfig';
import { FastEventBus, FastEvents, FX_ID_MAP } from '../core/FastEventBus';

export class VFXSystem implements IGameSystem {
  private spawner!: IEntitySpawner;
  private locator!: IServiceLocator;

  setup(locator: IServiceLocator): void {
    this.locator = locator;
    this.spawner = locator.getSpawner();
    this.setupListeners();
  }

  update(delta: number, time: number): void {
    // Process High Frequency Events
    FastEventBus.processEvents((id, a1, a2, a3, a4) => {
        if (id === FastEvents.SPAWN_FX) {
            // a1: TypeID, a2: X, a3: Y, a4: Angle
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
        this.addTrauma(isBig ? 0.6 : 0.3);
        if (isBig) this.triggerHitStop(0.1);
    });

    GameEventBus.subscribe(GameEvents.PANEL_DESTROYED, () => {
        this.addTrauma(0.7);
        this.triggerHitStop(0.15);
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

      const count = this.randomRange(recipe.count[0], recipe.count[1]);

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
              // angle passed in is the Entity's Rotation (Facing Direction)
              // We want sparks to fly BACKWARDS or SIDEWAYS depending on effect.
              // For Drills/Recoil, we want mostly backwards (debris/kickback).
              
              // Angle + PI = Backwards
              // - PI/2 = Model correction (since 0 rot is usually Right, but models point Up)
              // Actually, in our system:
              // Rotation 0 = Points Right (Math.atan2 style)
              // Driller Logic: Math.atan2(dy, dx) - PI/2 (Points Up)
              // If we pass raw Rotation, 0 is "Up" relative to the Driller Logic.
              
              // Let's assume 'angle' passed in is the correct Facing Angle in Radians (0 = Right).
              
              // Backwards = angle + PI.
              const baseDir = angle + Math.PI; 
              
              const spread = recipe.spread || 0.5;
              const a = baseDir + (Math.random() - 0.5) * spread;
              vx = Math.cos(a) * speed;
              vy = Math.sin(a) * speed;
          }

          this.spawner.spawnParticle(x, y, color, vx, vy, life);
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
