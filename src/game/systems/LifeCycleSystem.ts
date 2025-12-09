import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { LifetimeComponent } from '../components/data/LifetimeComponent';
import { HealthComponent } from '../components/data/HealthComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { TransformComponent } from '../components/data/TransformComponent';
import { EntityRegistry } from '../core/ecs/EntityRegistry';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { IEntitySpawner } from '../core/interfaces';

export class LifeCycleSystem implements IGameSystem {
  private registry!: EntityRegistry;
  private spawner!: IEntitySpawner;

  setup(locator: IServiceLocator): void {
    this.registry = locator.getRegistry() as EntityRegistry;
    this.spawner = locator.getSpawner();
    
    GameEventBus.subscribe(GameEvents.ZEN_MODE_ENABLED, () => {
        this.registry.clear();
        this.spawnPurgeEffect();
    });
  }

  update(delta: number, time: number): void {
    for (const entity of this.registry.getAll()) {
      if (!entity.active) continue;

      const lifetime = entity.getComponent<LifetimeComponent>('Lifetime');
      if (lifetime) {
        lifetime.remaining -= delta;
        if (lifetime.remaining <= 0) {
          this.registry.destroyEntity(entity.id);
          continue;
        }
      }

      const health = entity.getComponent<HealthComponent>('Health');
      // REFACTOR: Check property directly instead of .isDead getter
      if (health && health.current <= 0) {
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
          
          this.registry.destroyEntity(entity.id);
      }
    }
  }

  private spawnExplosion(x: number, y: number, type: string) {
      const color = type === 'hunter' ? '#F7D277' : type === 'kamikaze' ? '#FF003C' : '#9E4EA5';
      for(let i=0; i<12; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 15;
          const life = 0.5 + Math.random() * 0.5;
          this.spawner.spawnParticle(x, y, color, Math.cos(angle)*speed, Math.sin(angle)*speed, life);
      }
  }

  private spawnPurgeEffect() {
      for(let i=0; i<50; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 10 + Math.random() * 20;
          this.spawner.spawnParticle(0, 0, '#FFFFFF', Math.cos(angle)*speed, Math.sin(angle)*speed, 2.0);
      }
  }

  teardown(): void {}
}
