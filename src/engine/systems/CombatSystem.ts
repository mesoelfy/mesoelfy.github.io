import { IGameSystem, IEntityRegistry, IGameEventService, IAudioService, IFastEventService } from '@/engine/interfaces';
import { Entity } from '@/engine/ecs/Entity';
import { ColliderData } from '@/engine/ecs/components/ColliderData';
import { EnemyTypes } from '@/engine/config/Identifiers';
import { CollisionMatrix } from '@/engine/handlers/combat/CollisionMatrix';
import { CombatContext } from '@/engine/handlers/combat/types';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { GameEvents } from '@/engine/signals/GameEvents';
import { VFXKey } from '@/engine/config/AssetKeys';
import { getFXCode, getSoundCode, FXCode, SoundCode } from '@/engine/signals/FastEventBus';

export class CombatSystem implements IGameSystem {
  constructor(
    private registry: IEntityRegistry,
    private events: IGameEventService, // Slow Bus (Game Over, Score)
    private fastBus: IFastEventService, // Fast Bus (VFX, Audio, Flash)
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
              // Player hits are rare enough to stay on Slow Bus
              this.events.emit(GameEvents.PLAYER_HIT, { damage: amount });
          },
          destroyEntity: (entity, fx, angle) => this.destroyEntity(entity, fx, angle),
          
          spawnFX: (type, x, y) => {
              // OPTIMIZATION: Direct FastBus write
              const code = getFXCode(type);
              if (code !== FXCode.NONE) {
                  this.fastBus.spawnFX(code, x, y, 0);
              } else {
                  // Fallback for custom/complex FX not in Enum
                  this.events.emit(GameEvents.SPAWN_FX, { type: type as VFXKey, x, y, angle: 0 });
              }
          },
          
          spawnImpact: (x, y, r, g, b, angle) => {
              // Impacts are complex objects, keep on Slow Bus for now or add FastBus support later
              const toHex = (c: number) => Math.floor(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, '0');
              const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
              this.events.emit(GameEvents.SPAWN_IMPACT, { x, y, hexColor, angle });
          },
          
          playAudio: (key) => {
              const code = getSoundCode(key);
              if (code !== SoundCode.NONE) {
                  this.fastBus.playSound(code, 0);
              } else {
                  this.events.emit(GameEvents.PLAY_SOUND, { key });
              }
          },
          
          playSpatialAudio: (key, x) => {
              const code = getSoundCode(key);
              if (code !== SoundCode.NONE) {
                  this.fastBus.playSound(code, x);
              } else {
                  this.events.emit(GameEvents.PLAY_SOUND, { key, x });
              }
          },
          
          addTrauma: (amount) => {
              this.fastBus.camShake(amount);
          },
          
          flashEntity: (id) => {
              this.fastBus.flashEntity(id);
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
                  x: transform.x, 
                  y: transform.y, 
                  type: identity.variant 
              });
          }
      }

      this.registry.destroyEntity(entity.id);
      
      if (fx && transform) {
          let finalFX = fx;
          const angleToUse = impactAngle || 0;
          
          if (identity?.variant === EnemyTypes.HUNTER) {
              finalFX = impactAngle !== undefined ? 'EXPLOSION_YELLOW_DIR' : 'EXPLOSION_YELLOW';
          }
          else if (identity?.variant === EnemyTypes.KAMIKAZE) {
              finalFX = impactAngle !== undefined ? 'EXPLOSION_RED_DIR' : 'EXPLOSION_RED';
          }
          else if (identity?.variant === EnemyTypes.DRILLER) {
              finalFX = impactAngle !== undefined ? 'EXPLOSION_PURPLE_DIR' : 'EXPLOSION_PURPLE';
          }
          
          // Use FastBus for destruction FX
          const code = getFXCode(finalFX);
          if (code !== FXCode.NONE) {
              this.fastBus.spawnFX(code, transform.x, transform.y, angleToUse);
          } else {
              this.events.emit(GameEvents.SPAWN_FX, { 
                  type: finalFX as VFXKey, 
                  x: transform.x, 
                  y: transform.y, 
                  angle: angleToUse 
              });
          }
      }
  }

  teardown(): void {}
}
