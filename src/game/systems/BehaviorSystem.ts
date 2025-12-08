import { IGameSystem, IServiceLocator, IEntitySpawner } from '../core/interfaces';
import { EntityRegistry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { Behaviors, AIContext } from '../logic/ai/EnemyBehaviors';
import { PanelRegistry } from './PanelRegistrySystem';
import { GameEventBus } from '../events/GameEventBus';

export class BehaviorSystem implements IGameSystem {
  private registry!: EntityRegistry;
  private spawner!: IEntitySpawner;
  private locator!: IServiceLocator;

  setup(locator: IServiceLocator): void {
    this.registry = locator.getRegistry() as EntityRegistry;
    this.spawner = locator.getSpawner();
    this.locator = locator;
  }

  update(delta: number, time: number): void {
    const cursor = this.locator.getInputService().getCursor();
    const doDamageTick = Math.floor(time * 2) > Math.floor((time - delta) * 2);
    const worldPanels = PanelRegistry.getAllPanels().filter(p => !p.isDestroyed);

    const aiContext: AIContext = {
      playerPos: cursor,
      panels: worldPanels,
      delta,
      time,
      doDamageTick,
      spawnProjectile: (x, y, vx, vy) => this.spawner.spawnBullet(x, y, vx, vy, true, 3.0),
      triggerExplosion: (x, y, color) => this.spawnExplosion(x, y, color),
      spawnDrillSparks: (x, y, color) => this.spawnSparks(x, y, color),
      emitEvent: (name, payload) => GameEventBus.emit(name as any, payload),
      damagePanel: (id, amount) => PanelRegistry.damagePanel(id, amount),
      destroyEntity: (id) => this.registry.destroyEntity(id) // Fixed: Implementation
    };

    const enemies = this.registry.getByTag(Tag.ENEMY);
    for (const entity of enemies) {
        if (!entity.active) continue;
        const identity = entity.getComponent<IdentityComponent>('Identity');
        if (identity) {
             const behavior = Behaviors[identity.variant];
             if (behavior) behavior.update(entity, aiContext);
        }
    }
  }

  private spawnExplosion(x: number, y: number, color: string) {
      for(let i=0; i<8; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 15;
          this.spawner.spawnParticle(x, y, color, Math.cos(angle)*speed, Math.sin(angle)*speed, 0.8);
      }
  }

  private spawnSparks(x: number, y: number, color: string) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 2;
      this.spawner.spawnParticle(x, y, color, Math.cos(angle)*speed, Math.sin(angle)*speed, 0.25);
  }

  teardown(): void {}
}
