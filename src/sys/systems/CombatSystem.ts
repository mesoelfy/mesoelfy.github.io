import { IGameSystem, IServiceLocator, IGameStateSystem, IEntityRegistry } from '@/engine/interfaces';
import { Entity } from '@/engine/ecs/Entity';
import { ColliderData } from '@/sys/data/ColliderData';
import { TransformData } from '@/sys/data/TransformData';
import { IdentityData } from '@/sys/data/IdentityData';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents, FXVariant } from '@/engine/signals/GameEvents';
import { EnemyTypes } from '@/sys/config/Identifiers';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { CollisionMatrix } from '@/sys/handlers/combat/CollisionMatrix';
import { CombatContext } from '@/sys/handlers/combat/types';
import { FastEventBus, FastEvents, FX_IDS } from '@/engine/signals/FastEventBus';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class CombatSystem implements IGameSystem {
  private gameSystem!: IGameStateSystem;
  private registry!: IEntityRegistry;

  setup(locator: IServiceLocator): void {
    this.gameSystem = locator.getSystem<IGameStateSystem>('GameStateSystem');
    this.registry = locator.getRegistry();
  }

  update(delta: number, time: number): void {}

  public resolveCollision(e1: Entity, e2: Entity) {
      const col1 = e1.getComponent<ColliderData>(ComponentType.Collider);
      const col2 = e2.getComponent<ColliderData>(ComponentType.Collider);
      if (!col1 || !col2) return;

      const handler = CollisionMatrix.getHandler(col1.layer, col2.layer);
      if (!handler) return;

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
          spawnFX: (type, x, y) => {
              const id = FX_IDS[type];
              if (id) FastEventBus.emit(FastEvents.SPAWN_FX, id, x, y);
          },
          playAudio: (key) => AudioSystem.playSound(key),
          playSpatialAudio: (key, x) => {
              const idKey = key.toUpperCase();
              const soundId = FX_IDS[idKey];
              if (soundId) {
                  FastEventBus.emit(FastEvents.PLAY_SOUND, soundId, x);
              } else {
                  AudioSystem.playSound(key);
              }
          },
          addTrauma: (amount) => {
              GameEventBus.emit(GameEvents.TRAUMA_ADDED, { amount });
          }
      };

      handler(a, b, context);
  }

  private destroyEntity(entity: Entity, fx?: string) {
      const transform = entity.getComponent<TransformData>(ComponentType.Transform);
      const identity = entity.getComponent<IdentityData>(ComponentType.Identity);
      
      if (identity && transform) {
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
      
      if (fx && transform) {
          let finalFX = fx;
          if (identity?.variant === EnemyTypes.HUNTER) finalFX = 'EXPLOSION_YELLOW';
          if (identity?.variant === EnemyTypes.KAMIKAZE) finalFX = 'EXPLOSION_RED';
          
          const id = FX_IDS[finalFX];
          if (id) FastEventBus.emit(FastEvents.SPAWN_FX, id, transform.x, transform.y);
      }
  }

  teardown(): void {}
}
