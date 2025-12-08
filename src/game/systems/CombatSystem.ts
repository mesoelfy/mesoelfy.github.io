import { IGameSystem, IServiceLocator, IEntitySpawner } from '../core/interfaces';
import { Entity } from '../core/ecs/Entity';
import { GameStateSystem } from './GameStateSystem';
import { EntityRegistry } from '../core/ecs/EntityRegistry';
import { HealthComponent } from '../components/data/HealthComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { TransformComponent } from '../components/data/TransformComponent';
import { ColliderComponent } from '../components/data/ColliderComponent';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { EnemyTypes } from '../config/Identifiers';
import { CollisionLayers } from '../config/PhysicsConfig';

export class CombatSystem implements IGameSystem {
  private gameSystem!: GameStateSystem;
  private registry!: EntityRegistry;
  private spawner!: IEntitySpawner;

  setup(locator: IServiceLocator): void {
    this.gameSystem = locator.getSystem<GameStateSystem>('GameStateSystem');
    this.registry = locator.getRegistry() as EntityRegistry;
    this.spawner = locator.getSpawner();
  }

  update(delta: number, time: number): void {
    // Passive System - driven by resolveCollision call
  }

  public resolveCollision(e1: Entity, e2: Entity) {
      const col1 = e1.getComponent<ColliderComponent>('Collider');
      const col2 = e2.getComponent<ColliderComponent>('Collider');
      if (!col1 || !col2) return;

      // Sort: Player (1) < Enemy (2) < PlayerProj (4) < EnemyProj (8)
      let a = e1, b = e2;
      let layerA = col1.layer, layerB = col2.layer;

      if (layerA > layerB) {
          a = e2; b = e1;
          layerA = col2.layer; layerB = col1.layer;
      }

      // --- RESOLUTION LOGIC ---

      // 1. PLAYER vs ENEMY
      if (layerA === CollisionLayers.PLAYER && layerB === CollisionLayers.ENEMY) {
          const id = b.getComponent<IdentityComponent>('Identity');
          const damage = (id?.variant === EnemyTypes.KAMIKAZE) ? 25 : 10;
          this.damagePlayer(damage);
          this.destroyEnemy(b, true); // Explode
      }

      // 2. PLAYER vs ENEMY_PROJECTILE
      else if (layerA === CollisionLayers.PLAYER && layerB === CollisionLayers.ENEMY_PROJECTILE) {
          this.damagePlayer(10);
          this.destroyProjectile(b, '#FF003C');
      }

      // 3. ENEMY vs PLAYER_PROJECTILE
      else if (layerA === CollisionLayers.ENEMY && layerB === CollisionLayers.PLAYER_PROJECTILE) {
          const health = a.getComponent<HealthComponent>('Health');
          if (health) {
              health.damage(1);
              GameEventBus.emit(GameEvents.ENEMY_DAMAGED, { 
                  id: a.id as number, damage: 1, type: 'unknown' 
              });
          }
          this.destroyProjectile(b, '#FFFFFF', 0.2);
      }

      // 4. PROJECTILE vs PROJECTILE (Clash)
      else if (layerA === CollisionLayers.PLAYER_PROJECTILE && layerB === CollisionLayers.ENEMY_PROJECTILE) {
          this.destroyProjectile(a, '#F7D277');
          this.destroyProjectile(b, '#F7D277');
          const t = a.getComponent<TransformComponent>('Transform');
          if (t) GameEventBus.emit(GameEvents.PROJECTILE_CLASH, { x: t.x, y: t.y });
      }
  }

  private damagePlayer(amount: number) {
      this.gameSystem.damagePlayer(amount);
      GameEventBus.emit(GameEvents.PLAYER_HIT, { damage: amount });
  }

  private destroyEnemy(entity: Entity, explode: boolean) {
      this.registry.destroyEntity(entity.id);
      if (explode) {
          const t = entity.getComponent<TransformComponent>('Transform');
          if (t) this.spawnExplosion(t.x, t.y, '#9E4EA5');
      }
  }

  private destroyProjectile(entity: Entity, color: string, life = 0.5) {
      this.registry.destroyEntity(entity.id);
      const t = entity.getComponent<TransformComponent>('Transform');
      if (t) this.spawner.spawnParticle(t.x, t.y, color, 0, 0, life);
  }

  private spawnExplosion(x: number, y: number, color: string) {
      for(let i=0; i<8; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 15;
          this.spawner.spawnParticle(x, y, color, Math.cos(angle)*speed, Math.sin(angle)*speed, 0.8);
      }
  }

  teardown(): void {}
}
