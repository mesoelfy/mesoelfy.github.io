import { IGameSystem, IServiceLocator, IGameStateSystem, IEntityRegistry } from '@/core/interfaces';
import { Entity } from '@/core/ecs/Entity';
import { ColliderData } from '@/game/data/ColliderData';
import { TransformData } from '@/game/data/TransformData';
import { IdentityData } from '@/game/data/IdentityData';
import { GameEventBus } from '@/core/signals/GameEventBus';
import { GameEvents, FXVariant } from '@/core/signals/GameEvents';
import { EnemyTypes } from '@/game/config/Identifiers';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { CollisionMatrix } from '@/game/handlers/combat/CollisionMatrix';
import { CombatContext } from '@/game/handlers/combat/types';
import { FastEventBus, FastEvents, FX_IDS } from '@/core/signals/FastEventBus';
import { ComponentType } from '@/core/ecs/ComponentType';

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
          destroyEntity: (entity, fx, angle) => this.destroyEntity(entity, fx, angle),
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

  private destroyEntity(entity: Entity, fx?: string, impactAngle?: number) {
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
          let angleToUse = impactAngle || 0;
          
          if (identity?.variant === EnemyTypes.HUNTER) {
              finalFX = impactAngle !== undefined ? 'EXPLOSION_YELLOW_DIR' : 'EXPLOSION_YELLOW';
          }
          else if (identity?.variant === EnemyTypes.KAMIKAZE) {
              finalFX = impactAngle !== undefined ? 'EXPLOSION_RED_DIR' : 'EXPLOSION_RED';
          }
          else if (identity?.variant === EnemyTypes.DRILLER) {
              finalFX = impactAngle !== undefined ? 'EXPLOSION_PURPLE_DIR' : 'EXPLOSION_PURPLE';
          }
          
          const id = FX_IDS[finalFX];
          if (id) {
              FastEventBus.emit(FastEvents.SPAWN_FX, id, transform.x, transform.y, angleToUse);
          }
      }
  }

  teardown(): void {}
}
