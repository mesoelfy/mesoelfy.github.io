import { IGameSystem, IEntityRegistry, IGameEventService } from '@/engine/interfaces';
import { LifetimeData } from '@/engine/ecs/components/LifetimeData';
import { HealthData } from '@/engine/ecs/components/HealthData';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { GameEvents, FXVariant } from '@/engine/signals/GameEvents';
import { FastEvents, FX_IDS } from '@/engine/signals/FastEventBus';
import { EnemyTypes } from '@/engine/config/Identifiers';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class LifeCycleSystem implements IGameSystem {
  constructor(
    private registry: IEntityRegistry,
    private events: IGameEventService
  ) {
    this.events.subscribe(GameEvents.ZEN_MODE_ENABLED, () => {
        this.registry.clear();
    });
  }

  update(delta: number, time: number): void {
    const mortals = this.registry.query({ any: [ComponentType.Lifetime, ComponentType.Health] });

    for (const entity of mortals) {
      if (!entity.active) continue;

      const lifetime = entity.getComponent<LifetimeData>(ComponentType.Lifetime);
      if (lifetime) {
        lifetime.remaining -= delta;
        if (lifetime.remaining <= 0) {
          this.registry.destroyEntity(entity.id);
          continue;
        }
      }

      const health = entity.getComponent<HealthData>(ComponentType.Health);
      if (health && health.current <= 0) {
          const identity = entity.getComponent<IdentityData>(ComponentType.Identity);
          const transform = entity.getComponent<TransformData>(ComponentType.Transform);
          
          if (identity && transform) {
             this.events.emit(GameEvents.ENEMY_DESTROYED, { 
                id: entity.id as number, 
                type: identity.variant, 
                x: transform.x, 
                y: transform.y 
             });
             
             let fx: FXVariant = 'EXPLOSION_PURPLE';
             if (identity.variant === EnemyTypes.HUNTER) fx = 'EXPLOSION_YELLOW';
             else if (identity.variant === EnemyTypes.KAMIKAZE) fx = 'EXPLOSION_RED';
             
             // Emitting SPAWN_FX via normal event bus for VFXSystem to pick up
             this.events.emit(GameEvents.SPAWN_FX, { type: fx, x: transform.x, y: transform.y });
          }
          
          this.registry.destroyEntity(entity.id);
      }
    }
  }

  teardown(): void {}
}
