import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { Entity } from '../core/ecs/Entity';
import { GameStateSystem } from './GameStateSystem';
import { EntityRegistry } from '../core/ecs/EntityRegistry';
import { HealthComponent } from '../components/data/HealthComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { TransformComponent } from '../components/data/TransformComponent';
import { ColliderComponent } from '../components/data/ColliderComponent';
import { StateComponent } from '../components/data/StateComponent';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents, FXVariant } from '../events/GameEvents';
import { EnemyTypes } from '../config/Identifiers';
import { CollisionLayers } from '../config/PhysicsConfig';

export class CombatSystem implements IGameSystem {
  private gameSystem!: GameStateSystem;
  private registry!: EntityRegistry;

  setup(locator: IServiceLocator): void {
    this.gameSystem = locator.getSystem<GameStateSystem>('GameStateSystem');
    this.registry = locator.getRegistry() as EntityRegistry;
  }

  update(delta: number, time: number): void {}

  public resolveCollision(e1: Entity, e2: Entity) {
      const col1 = e1.getComponent<ColliderComponent>('Collider');
      const col2 = e2.getComponent<ColliderComponent>('Collider');
      if (!col1 || !col2) return;

      let a = e1, b = e2;
      let layerA = col1.layer, layerB = col2.layer;

      if (layerA > layerB) {
          a = e2; b = e1;
          layerA = col2.layer; layerB = col1.layer;
      }

      // 1. PLAYER vs ENEMY (Crash)
      if (layerA === CollisionLayers.PLAYER && layerB === CollisionLayers.ENEMY) {
          const idA = a.getComponent<IdentityComponent>('Identity');
          
          if (idA?.variant === EnemyTypes.DAEMON) {
              this.resolveDaemonCollision(a, b);
          } else {
              const id = b.getComponent<IdentityComponent>('Identity');
              const damage = (id?.variant === EnemyTypes.KAMIKAZE) ? 25 : 10;
              this.damagePlayer(damage);
              this.destroyEnemy(b, true); 
          }
      }

      // 2. PLAYER vs ENEMY_PROJECTILE (Hit)
      else if (layerA === CollisionLayers.PLAYER && layerB === CollisionLayers.ENEMY_PROJECTILE) {
          const idA = a.getComponent<IdentityComponent>('Identity');
          if (idA?.variant === EnemyTypes.DAEMON) {
              this.resolveDaemonCollision(a, b, 5); 
          } else {
              this.damagePlayer(10);
              this.destroyProjectile(b, 'IMPACT_RED'); 
          }
      }

      // 3. ENEMY vs PLAYER_PROJECTILE (Damage)
      else if (layerA === CollisionLayers.ENEMY && layerB === CollisionLayers.PLAYER_PROJECTILE) {
          this.handleMassExchange(a, b, 'IMPACT_WHITE');
      }

      // 4. PROJECTILE vs PROJECTILE (Clash)
      else if (layerA === CollisionLayers.PLAYER_PROJECTILE && layerB === CollisionLayers.ENEMY_PROJECTILE) {
          this.handleMassExchange(a, b, 'CLASH_YELLOW');
      }
  }

  private resolveDaemonCollision(daemon: Entity, enemyOrBullet: Entity, fixedDamage?: number) {
      const state = daemon.getComponent<StateComponent>('State');
      if (!state) return;

      let incomingDamage = fixedDamage || 10;
      if (!fixedDamage) {
          const enemyHp = enemyOrBullet.getComponent<HealthComponent>('Health');
          const eId = enemyOrBullet.getComponent<IdentityComponent>('Identity');
          if (eId?.variant === EnemyTypes.KAMIKAZE) incomingDamage = 20;
          else if (enemyHp) incomingDamage = enemyHp.current * 5; 
      }

      const shield = state.data.shieldHP || 0;

      if (state.current === 'CHARGING' || state.current === 'READY') {
          if (shield > 0) {
              state.data.shieldHP = Math.max(0, shield - incomingDamage);
              state.data.wasHit = true; 
              
              if (enemyOrBullet.hasTag('ENEMY')) {
                  this.destroyEnemy(enemyOrBullet, true);
                  GameEventBus.emit(GameEvents.SPAWN_FX, { type: 'CLASH_YELLOW', x: 0, y: 0 });
              } else {
                  this.destroyProjectile(enemyOrBullet, 'IMPACT_WHITE');
              }
              return;
          }
      }

      if (enemyOrBullet.hasTag('ENEMY')) {
          this.destroyEnemy(enemyOrBullet, true);
      } else {
          this.destroyProjectile(enemyOrBullet, 'IMPACT_RED');
      }
  }

  private handleMassExchange(entityA: Entity, entityB: Entity, fx: FXVariant) {
      const hpA = entityA.getComponent<HealthComponent>('Health');
      const hpB = entityB.getComponent<HealthComponent>('Health');

      const healthA = hpA ? hpA.current : 1;
      const healthB = hpB ? hpB.current : 1;

      const impact = Math.min(healthA, healthB);

      // REFACTOR: Direct Data Manipulation (Pure ECS)
      if (hpA) hpA.current = Math.max(0, hpA.current - impact);
      if (hpB) hpB.current = Math.max(0, hpB.current - impact);

      const tA = entityA.getComponent<TransformComponent>('Transform');
      if (tA) GameEventBus.emit(GameEvents.SPAWN_FX, { type: fx, x: tA.x, y: tA.y });

      // REFACTOR: Check property directly
      if (hpA && hpA.current <= 0) {
          if (entityA.getComponent('Identity')) this.destroyEnemy(entityA, true);
          else this.destroyProjectile(entityA, 'IMPACT_WHITE');
      }
      
      if (hpB && hpB.current <= 0) {
          this.destroyProjectile(entityB, 'IMPACT_WHITE');
      }
  }

  private damagePlayer(amount: number) {
      this.gameSystem.damagePlayer(amount);
      GameEventBus.emit(GameEvents.PLAYER_HIT, { damage: amount });
  }

  private destroyEnemy(entity: Entity, explode: boolean) {
      const transform = entity.getComponent<TransformComponent>('Transform');
      const identity = entity.getComponent<IdentityComponent>('Identity');
      
      if (transform && identity) {
          GameEventBus.emit(GameEvents.ENEMY_DESTROYED, { 
              id: entity.id as number, 
              type: identity.variant,
              x: transform.x,
              y: transform.y
          });
      }

      this.registry.destroyEntity(entity.id);
      
      if (explode && transform && identity) {
          let fx: FXVariant = 'EXPLOSION_PURPLE';
          if (identity.variant === EnemyTypes.HUNTER) fx = 'EXPLOSION_YELLOW';
          if (identity.variant === EnemyTypes.KAMIKAZE) fx = 'EXPLOSION_RED';
          GameEventBus.emit(GameEvents.SPAWN_FX, { type: fx, x: transform.x, y: transform.y });
      }
  }

  private destroyProjectile(entity: Entity, fx: FXVariant) {
      this.registry.destroyEntity(entity.id);
      const t = entity.getComponent<TransformComponent>('Transform');
      if (t) {
          GameEventBus.emit(GameEvents.SPAWN_FX, { type: fx, x: t.x, y: t.y });
      }
  }

  teardown(): void {}
}
