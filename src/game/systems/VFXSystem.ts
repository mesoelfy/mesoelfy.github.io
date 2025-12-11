import { IGameSystem, IServiceLocator, IEntitySpawner } from '../core/interfaces';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents, FXVariant } from '../events/GameEvents';
import { ShakeSystem } from './ShakeSystem';
import { TimeSystem } from './TimeSystem';
import { VFX_RECIPES } from '../config/VFXConfig';

export class VFXSystem implements IGameSystem {
  private spawner!: IEntitySpawner;
  private locator!: IServiceLocator;

  setup(locator: IServiceLocator): void {
    this.locator = locator;
    this.spawner = locator.getSpawner();
    this.setupListeners();
  }

  update(delta: number, time: number): void {
    // Passive system, driven by events
  }

  teardown(): void {}

  private setupListeners() {
    GameEventBus.subscribe(GameEvents.SPAWN_FX, (p) => {
        this.executeRecipe(p.type, p.x, p.y, p.angle);
    });

    // High Level Event Reactions
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
    
    // Purge Effect (Zen Mode)
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
              const baseDir = angle - (Math.PI / 2);
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
