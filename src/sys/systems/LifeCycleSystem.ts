import { IGameSystem, IServiceLocator } from '@/engine/interfaces';
import { LifetimeData } from '@/sys/data/LifetimeData';
import { HealthData } from '@/sys/data/HealthData';
import { IdentityData } from '@/sys/data/IdentityData';
import { TransformData } from '@/sys/data/TransformData';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents, FXVariant } from '@/engine/signals/GameEvents';
import { EnemyTypes } from '@/sys/config/Identifiers';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class LifeCycleSystem implements IGameSystem {
  private registry!: EntityRegistry;

  setup(locator: IServiceLocator): void {
    this.registry = locator.getRegistry() as EntityRegistry;
    
    GameEventBus.subscribe(GameEvents.ZEN_MODE_ENABLED, () => {
        this.registry.clear();
    });
  }

  update(delta: number, time: number): void {
    // Enum Query
    const mortals = this.registry.query({ any: [ComponentType.Lifetime, ComponentType.Health] });

    for (const entity of mortals) {
      if (!entity.active) continue;

      // Time Check
      const lifetime = entity.getComponent<LifetimeData>(ComponentType.Lifetime);
      if (lifetime) {
        lifetime.remaining -= delta;
        if (lifetime.remaining <= 0) {
          this.registry.destroyEntity(entity.id);
          continue;
        }
      }

      // Health Check
      const health = entity.getComponent<HealthData>(ComponentType.Health);
      if (health && health.current <= 0) {
          const identity = entity.getComponent<IdentityData>(ComponentType.Identity);
          const transform = entity.getComponent<TransformData>(ComponentType.Transform);
          
          if (identity && transform) {
             GameEventBus.emit(GameEvents.ENEMY_DESTROYED, { 
                id: entity.id as number, 
                type: identity.variant, 
                x: transform.x, 
                y: transform.y 
             });
             
             let fx: FXVariant = 'EXPLOSION_PURPLE';
             if (identity.variant === EnemyTypes.HUNTER) fx = 'EXPLOSION_YELLOW';
             else if (identity.variant === EnemyTypes.KAMIKAZE) fx = 'EXPLOSION_RED';
             
             GameEventBus.emit(GameEvents.SPAWN_FX, { type: fx, x: transform.x, y: transform.y });
          }
          
          this.registry.destroyEntity(entity.id);
      }
    }
  }

  teardown(): void {}
}
