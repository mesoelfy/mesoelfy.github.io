import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { Registry } from '../core/ecs/EntityRegistry';
import { EntityFactory } from '../core/EntityFactory';
import { SpatialGrid } from '../core/SpatialGrid';
import { Tag } from '../core/ecs/types';

// Components
import { TransformComponent } from '../components/data/TransformComponent';
import { MotionComponent } from '../components/data/MotionComponent';
import { LifetimeComponent } from '../components/data/LifetimeComponent';
import { HealthComponent } from '../components/data/HealthComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';

import { Behaviors, AIContext } from '../logic/ai/EnemyBehaviors';
import { GameEvents } from '../events/GameEvents';
import { EnemyType } from '../config/Identifiers'; // CORRECTED IMPORT
import { GameEventBus } from '../events/GameEventBus';
import { useGameStore } from '../store/useGameStore';
import { ViewportHelper } from '../utils/ViewportHelper';

export class EntitySystem implements IGameSystem {
  public spatialGrid: SpatialGrid;
  private locator!: IServiceLocator;

  constructor() {
    this.spatialGrid = new SpatialGrid(4); // 4x4 buckets
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

    // AI Context
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
      triggerExplosion: (x, y, color) => EntityFactory.createParticle(x, y, color, 0, 0, 1.0), 
      emitEvent: (name, payload) => GameEventBus.emit(name as any, payload),
      damagePanel: (id, amount) => {
        useGameStore.getState().damagePanel(id, amount);
      }
    };

    // --- MAIN ECS LOOP ---
    for (const entity of Registry.getAll()) {
      if (!entity.active) continue;

      // 1. LIFETIME
      const lifetime = entity.getComponent<LifetimeComponent>('Lifetime');
      if (lifetime) {
        lifetime.remaining -= delta;
        if (lifetime.remaining <= 0) {
          Registry.destroyEntity(entity.id);
          continue;
        }
      }

      // 2. HEALTH CHECK
      const health = entity.getComponent<HealthComponent>('Health');
      if (health && health.isDead) {
          Registry.destroyEntity(entity.id);
          
          // Emit Death Event
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

      // 3. MOTION -> TRANSFORM
      const transform = entity.getComponent<TransformComponent>('Transform');
      const motion = entity.getComponent<MotionComponent>('Motion');
      
      if (transform && motion) {
        transform.x += motion.vx * delta;
        transform.y += motion.vy * delta;
        
        // Update Spatial Grid
        this.spatialGrid.insert(entity.id, transform.x, transform.y);
      }

      // 4. AI UPDATE
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

  // --- PUBLIC API ---
  
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

  public spawnParticle(x: number, y: number, color: string, count: number) {
      for(let i=0; i<count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 10 + 5;
          EntityFactory.createParticle(
            x, y, 
            color, 
            Math.cos(angle)*speed, Math.sin(angle)*speed, 
            0.5 + Math.random()*0.5
          );
      }
  }

  private spawnExplosion(x: number, y: number, type: string) {
      const color = type === 'hunter' ? '#F7D277' : type === 'kamikaze' ? '#FF003C' : '#9E4EA5';
      this.spawnParticle(x, y, color, 12);
  }
}
