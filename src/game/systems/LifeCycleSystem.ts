import { IGameSystem, IServiceLocator } from '@/core/interfaces';
import { LifetimeData } from '@/game/data/LifetimeData';
import { HealthData } from '@/game/data/HealthData';
import { IdentityData } from '@/game/data/IdentityData';
import { TransformData } from '@/game/data/TransformData';
import { EntityRegistry } from '@/core/ecs/EntityRegistry';
import { GameEventBus } from '@/core/signals/GameEventBus';
import { GameEvents, FXVariant } from '@/core/signals/GameEvents';
import { EnemyTypes } from '@/game/config/Identifiers';
import { ComponentType } from '@/core/ecs/ComponentType';

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
