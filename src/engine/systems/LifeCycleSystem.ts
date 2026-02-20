import { IGameSystem, IEntityRegistry, IGameEventService } from '@/engine/interfaces';
import { LifetimeData } from '@/engine/ecs/components/LifetimeData';
import { HealthData } from '@/engine/ecs/components/HealthData';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { GameEvents, FXVariant } from '@/engine/signals/GameEvents';
import { EnemyTypes, EnemyType } from '@/engine/config/Identifiers';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { Tag } from '@/engine/ecs/types';
import { Query } from '@/engine/ecs/Query';
import { ENEMIES } from '@/engine/config/defs/Enemies';

export class LifeCycleSystem implements IGameSystem {
  private mortalQuery = new Query({ any: [ComponentType.Lifetime, ComponentType.Health] });
  private unsubs: (() => void)[] = [];

  constructor(
    private registry: IEntityRegistry,
    private events: IGameEventService
  ) {
    this.unsubs.push(this.events.subscribe(GameEvents.GAME_OVER, () => {
        this.purgeSummons();
    }));
  }

  update(delta: number, time: number): void {
    const mortals = this.registry.query(this.mortalQuery);

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
          if (entity.hasTag(Tag.PLAYER)) continue;

          const identity = entity.getComponent<IdentityData>(ComponentType.Identity);
          const transform = entity.getComponent<TransformData>(ComponentType.Transform);
          
          if (identity && transform) {
             const isEnemy = Object.values(EnemyTypes).includes(identity.variant as any);
             if (isEnemy && identity.variant !== EnemyTypes.DAEMON) {
                 this.events.emit(GameEvents.ENEMY_DESTROYED, { id: entity.id as number, type: identity.variant, x: transform.x, y: transform.y });
             }
             
             const def = ENEMIES[identity.variant as EnemyType];
             const fx: FXVariant = (def?.deathFX || 'EXPLOSION_PURPLE') as FXVariant;
             
             this.events.emit(GameEvents.SPAWN_FX, { type: fx, x: transform.x, y: transform.y });
          }
          
          this.registry.destroyEntity(entity.id);
      }
    }
  }

  private purgeSummons() {
      const allies = this.registry.getByTag(Tag.PLAYER);
      for (const entity of allies) {
          if (!entity.active) continue;
          
          const identity = entity.getComponent<IdentityData>(ComponentType.Identity);
          if (identity && identity.variant === EnemyTypes.DAEMON) {
              const transform = entity.getComponent<TransformData>(ComponentType.Transform);
              if (transform) {
                  this.events.emit(GameEvents.SPAWN_FX, { type: 'IMPACT_WHITE', x: transform.x, y: transform.y });
              }
              this.registry.destroyEntity(entity.id);
          }
      }
  }

  teardown(): void {
      this.unsubs.forEach(u => u());
      this.unsubs = [];
  }
}
