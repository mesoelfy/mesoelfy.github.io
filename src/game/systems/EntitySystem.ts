import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { Registry } from '../core/ecs/EntityRegistry';
import { EntityFactory } from '../core/EntityFactory';
import { SpatialGrid } from '../core/SpatialGrid';
import { Tag } from '../core/ecs/types';

import { TransformComponent } from '../components/data/TransformComponent';
import { MotionComponent } from '../components/data/MotionComponent';
import { LifetimeComponent } from '../components/data/LifetimeComponent';
import { HealthComponent } from '../components/data/HealthComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';

import { Behaviors, AIContext } from '../logic/ai/EnemyBehaviors';
import { GameEvents } from '../events/GameEvents';
import { EnemyType } from '../config/Identifiers'; 
import { GameEventBus } from '../events/GameEventBus';
import { useGameStore } from '../store/useGameStore';
import { ViewportHelper } from '../utils/ViewportHelper';

export class EntitySystem implements IGameSystem {
  public spatialGrid: SpatialGrid;
  private locator!: IServiceLocator;

  constructor() {
    this.spatialGrid = new SpatialGrid(4);
  }

  setup(locator: IServiceLocator): void {
    this.locator = locator;
    Registry.clear();
    this.spatialGrid.clear();
  }

  update(delta: number, time: number): void {
    this.spatialGrid.clear();
    const cursor = this.locator.getInputService().getCursor();
    const doDamageTick = Math.floor(time * 2) > Math.floor((time - delta) * 2);

    const panels = useGameStore.getState().panels;
    const worldPanels = Object.values(panels)
      .filter(p => !p.isDestroyed)
      .map(p => ViewportHelper.getPanelWorldRect(p))
      .filter(r => r !== null);

    const aiContext: AIContext = {
      playerPos: cursor,
      panels: worldPanels,
      delta,
      time,
      doDamageTick,
      spawnProjectile: (x, y, vx, vy) => EntityFactory.createBullet(x, y, vx, vy, true, 3.0),
      
      triggerExplosion: (x, y, color) => this.spawnParticle(x, y, color, 8, 15, 0.8),
      
      // FIX: Constant, concentrated sparks for drilling
      spawnDrillSparks: (x, y, color) => {
          // Spawn 1 particle per frame for constant stream
          // Low speed (2.0), Short life (0.2)
          this.spawnParticle(x, y, color, 1, 3.0, 0.25);
      },
      
      emitEvent: (name, payload) => GameEventBus.emit(name as any, payload),
      damagePanel: (id, amount) => {
        useGameStore.getState().damagePanel(id, amount);
      }
    };

    for (const entity of Registry.getAll()) {
      if (!entity.active) continue;

      const lifetime = entity.getComponent<LifetimeComponent>('Lifetime');
      if (lifetime) {
        lifetime.remaining -= delta;
        if (lifetime.remaining <= 0) {
          Registry.destroyEntity(entity.id);
          continue;
        }
      }

      const health = entity.getComponent<HealthComponent>('Health');
      if (health && health.isDead) {
          Registry.destroyEntity(entity.id);
          
          const identity = entity.getComponent<IdentityComponent>('Identity');
          const transform = entity.getComponent<TransformComponent>('Transform');
          
          if (identity && transform) {
             GameEventBus.emit(GameEvents.ENEMY_DESTROYED, { 
                id: entity.id as number, 
                type: identity.variant, 
                x: transform.x, 
                y: transform.y 
             });
             
             this.spawnExplosion(transform.x, transform.y, identity.variant);
          }
          continue;
      }

      const transform = entity.getComponent<TransformComponent>('Transform');
      const motion = entity.getComponent<MotionComponent>('Motion');
      
      if (transform && motion) {
        transform.x += motion.vx * delta;
        transform.y += motion.vy * delta;
        this.spatialGrid.insert(entity.id, transform.x, transform.y);
      }

      if (entity.hasTag(Tag.ENEMY)) {
        const identity = entity.getComponent<IdentityComponent>('Identity');
        if (identity && transform && motion) {
             const behavior = Behaviors[identity.variant];
             if (behavior) behavior.update(entity, aiContext);
        }
      }
    }
  }

  teardown(): void {
    Registry.clear();
    this.spatialGrid.clear();
  }

  public spawnEnemy(type: EnemyType) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 25; 
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      const e = EntityFactory.createEnemy(type, x, y);
      GameEventBus.emit(GameEvents.ENEMY_SPAWNED, { type, id: e.id as number });
  }

  public spawnBullet(x: number, y: number, vx: number, vy: number, isEnemy: boolean, life: number, radius: number) {
      EntityFactory.createBullet(x, y, vx, vy, isEnemy, life);
  }

  // FIX: Added speedScale and lifeScale parameters
  public spawnParticle(x: number, y: number, color: string, count: number, speedScale = 15, lifeScale = 1.0) {
      for(let i=0; i<count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * speedScale; 
          const life = (0.2 + Math.random() * 0.3) * lifeScale;
          
          EntityFactory.createParticle(
            x, y, 
            color, 
            Math.cos(angle)*speed, Math.sin(angle)*speed, 
            life
          );
      }
  }

  private spawnExplosion(x: number, y: number, type: string) {
      const color = type === 'hunter' ? '#F7D277' : type === 'kamikaze' ? '#FF003C' : '#9E4EA5';
      this.spawnParticle(x, y, color, 12, 15, 1.0);
  }
}
