import { GameEventBus } from '../events/GameEventBus';
import { GameEvents, FXVariant } from '../events/GameEvents';
import { ServiceLocator } from '../core/ServiceLocator';
import { TimeSystem } from './TimeSystem';
import { CameraSystem } from './CameraSystem';
import { IEntitySpawner } from '../core/interfaces';

class FXManagerController {
  private initialized = false;
  private spawner!: IEntitySpawner;

  private readonly PURPLE_PALETTE = ['#9E4EA5', '#D0A3D8', '#E0B0FF', '#7A2F8F', '#B57EDC'];
  private readonly YELLOW_PALETTE = ['#F7D277', '#FFE5A0', '#FFA500', '#FFFFFF'];
  
  public init() {
    if (this.initialized) return;
    
    // Get Spawner from Locator
    // Note: FXManager is a singleton, but ServiceLocator is populated by GameBootstrapper.
    // We assume init() is called after Bootstrapper is ready.
    try {
        this.spawner = ServiceLocator.getSpawner();
    } catch (e) {
        console.warn("[FXManager] Spawner not ready yet.");
        return;
    }

    // --- GENERIC FX LISTENER ---
    GameEventBus.subscribe(GameEvents.SPAWN_FX, (p) => {
        this.handleFX(p.type, p.x, p.y, p.angle);
    });

    // --- GAMEPLAY EVENTS ---
    GameEventBus.subscribe(GameEvents.PANEL_DESTROYED, () => {
        this.addTrauma(0.7);
        this.triggerHitStop(0.15); 
    });
    
    GameEventBus.subscribe(GameEvents.PLAYER_HIT, (p) => {
        const isBig = p.damage > 10;
        this.addTrauma(isBig ? 0.6 : 0.3);
        if (isBig) this.triggerHitStop(0.1);
    });
    
    GameEventBus.subscribe(GameEvents.GAME_OVER, () => {
        this.addTrauma(1.0);
        this.triggerHitStop(0.5);
    });
    
    this.initialized = true;
  }

  private handleFX(type: FXVariant, x: number, y: number, angle: number = 0) {
      if (!this.spawner) return;

      switch (type) {
          case 'DRILL_SPARKS':
              // Backward spray from angle
              this.spawnDirectionalSparks(x, y, angle, this.PURPLE_PALETTE, 5, 6, 0.5);
              break;
          case 'HUNTER_RECOIL':
              // Explosive backward spray
              this.spawnDirectionalSparks(x, y, angle, this.YELLOW_PALETTE, 12, 15, 0.8);
              break;
          case 'EXPLOSION_PURPLE':
              this.spawnRadialExplosion(x, y, '#9E4EA5');
              break;
          case 'EXPLOSION_YELLOW':
              this.spawnRadialExplosion(x, y, '#F7D277');
              break;
          case 'EXPLOSION_RED':
              this.spawnRadialExplosion(x, y, '#FF003C');
              break;
          case 'IMPACT_WHITE':
              this.spawner.spawnParticle(x, y, '#FFFFFF', 0, 0, 0.2);
              break;
          case 'IMPACT_RED':
              this.spawner.spawnParticle(x, y, '#FF003C', 0, 0, 0.5);
              break;
          case 'CLASH_YELLOW':
              this.spawner.spawnParticle(x, y, '#F7D277', 0, 0, 0.5);
              break;
      }
  }

  private spawnDirectionalSparks(x: number, y: number, facingAngle: number, palette: string[], count: number, speedBase: number, spreadFactor: number) {
      // Eject backwards relative to facing
      const baseEject = facingAngle - (Math.PI / 2);

      for(let i=0; i<count; i++) {
          const color = palette[Math.floor(Math.random() * palette.length)];
          const spread = (Math.random() - 0.5) * spreadFactor; 
          const a = baseEject + spread;
          const speed = speedBase + Math.random() * 5;
          const vx = Math.cos(a) * speed;
          const vy = Math.sin(a) * speed;
          const life = 0.1 + Math.random() * 0.15;

          this.spawner.spawnParticle(x, y, color, vx, vy, life);
      }
  }

  private spawnRadialExplosion(x: number, y: number, color: string) {
      for(let i=0; i<12; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 15;
          this.spawner.spawnParticle(x, y, color, Math.cos(angle)*speed, Math.sin(angle)*speed, 0.8);
      }
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
