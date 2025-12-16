import { IGameSystem, IEntityRegistry, IGameEventService, IFastEventService, IAudioService } from '@/engine/interfaces';
import { Entity } from '@/engine/ecs/Entity';
import { ColliderData } from '@/engine/ecs/components/ColliderData';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { GameEvents } from '@/engine/signals/GameEvents';
import { EnemyTypes } from '@/engine/config/Identifiers';
import { CollisionMatrix } from '@/engine/handlers/combat/CollisionMatrix';
import { CombatContext } from '@/engine/handlers/combat/types';
import { FastEvents, FX_IDS } from '@/engine/signals/FastEventBus';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class CombatSystem implements IGameSystem {
  constructor(
    private registry: IEntityRegistry,
    private events: IGameEventService,
    private fastEvents: IFastEventService,
    private audio: IAudioService
  ) {}

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
              // DECOUPLED: Only emit event. HealthSystem handles the logic.
              this.events.emit(GameEvents.PLAYER_HIT, { damage: amount });
          },
          destroyEntity: (entity, fx, angle) => this.destroyEntity(entity, fx, angle),
          spawnFX: (type, x, y) => {
              const id = FX_IDS[type];
              if (id) this.fastEvents.emit(FastEvents.SPAWN_FX, id, x, y);
          },
          playAudio: (key) => this.audio.playSound(key),
          playSpatialAudio: (key, x) => {
              const idKey = key.toUpperCase();
              const soundId = FX_IDS[idKey];
              if (soundId) {
                  this.fastEvents.emit(FastEvents.PLAY_SOUND, soundId, x);
              } else {
                  this.audio.playSound(key);
              }
          },
          addTrauma: (amount) => {
              this.events.emit(GameEvents.TRAUMA_ADDED, { amount });
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
              this.events.emit(GameEvents.ENEMY_DESTROYED, { 
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
              this.fastEvents.emit(FastEvents.SPAWN_FX, id, transform.x, transform.y, angleToUse);
          }
      }
  }

  teardown(): void {}
}
