import { IGameSystem, IServiceLocator, IGameStateSystem, IEntityRegistry } from '../core/interfaces';
import { Entity } from '../core/ecs/Entity';
import { ColliderComponent } from '../components/data/ColliderComponent';
import { TransformComponent } from '../components/data/TransformComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents, FXVariant } from '../events/GameEvents';
import { EnemyTypes } from '../config/Identifiers';
import { AudioSystem } from '@/core/audio/AudioSystem';

// Logic
import { CollisionMatrix } from '../logic/combat/CollisionMatrix';
import { CombatContext } from '../logic/combat/types';

export class CombatSystem implements IGameSystem {
  private gameSystem!: IGameStateSystem;
  private registry!: IEntityRegistry;

  setup(locator: IServiceLocator): void {
    this.gameSystem = locator.getSystem<IGameStateSystem>('GameStateSystem');
    this.registry = locator.getRegistry();
  }

  update(delta: number, time: number): void {}

  public resolveCollision(e1: Entity, e2: Entity) {
      const col1 = e1.getComponent<ColliderComponent>('Collider');
      const col2 = e2.getComponent<ColliderComponent>('Collider');
      if (!col1 || !col2) return;

      const handler = CollisionMatrix.getHandler(col1.layer, col2.layer);
      if (!handler) return;

      // Ensure consistent ordering for the handler based on Layer ID
      // The matrix expects arguments to match the registration order logic, 
      // but since we handle specific cases inside the handlers (e.g. "which one is the player?"),
      // we usually pass them sorted by layer to be safe, or let the handler sort them.
      // 
      // Convention: We pass them sorted by Layer ID (Ascending) so handlers know 
      // Arg1 is likely Player (Layer 1) vs Enemy (Layer 2).
      
      let a = e1, b = e2;
      if (col1.layer > col2.layer) {
          a = e2; b = e1;
      }

      const context: CombatContext = {
          damagePlayer: (amount) => {
              this.gameSystem.damagePlayer(amount);
              GameEventBus.emit(GameEvents.PLAYER_HIT, { damage: amount });
          },
          destroyEntity: (entity, fx) => this.destroyEntity(entity, fx),
          spawnFX: (type, x, y) => GameEventBus.emit(GameEvents.SPAWN_FX, { type: type as FXVariant, x, y }),
          playAudio: (key) => AudioSystem.playSound(key)
      };

      handler(a, b, context);
  }

  private destroyEntity(entity: Entity, fx?: string) {
      const transform = entity.getComponent<TransformComponent>('Transform');
      const identity = entity.getComponent<IdentityComponent>('Identity');
      
      // If it's an enemy, emit score event
      if (identity && transform) {
          // Check if it's a known enemy type
          const isEnemy = Object.values(EnemyTypes).includes(identity.variant as any);
          if (isEnemy && identity.variant !== EnemyTypes.DAEMON) {
              GameEventBus.emit(GameEvents.ENEMY_DESTROYED, { 
                  id: entity.id as number, 
                  type: identity.variant,
                  x: transform.x,
                  y: transform.y
              });
          }
      }

      this.registry.destroyEntity(entity.id);
      
      // Spawn Death FX
      if (fx && transform) {
          // Special overrides for specific enemies
          let finalFX = fx;
          if (identity?.variant === EnemyTypes.HUNTER) finalFX = 'EXPLOSION_YELLOW';
          if (identity?.variant === EnemyTypes.KAMIKAZE) finalFX = 'EXPLOSION_RED';
          
          GameEventBus.emit(GameEvents.SPAWN_FX, { type: finalFX as FXVariant, x: transform.x, y: transform.y });
      }
  }

  teardown(): void {}
}
