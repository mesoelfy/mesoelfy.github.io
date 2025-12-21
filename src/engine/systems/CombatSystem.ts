import { IGameSystem, IEntityRegistry, IGameEventService, IFastEventService, IAudioService } from '@/engine/interfaces';
import { Entity } from '@/engine/ecs/Entity';
import { ColliderData } from '@/engine/ecs/components/ColliderData';
import { EnemyTypes } from '@/engine/config/Identifiers';
import { CollisionMatrix } from '@/engine/handlers/combat/CollisionMatrix';
import { CombatContext } from '@/engine/handlers/combat/types';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { GameEvents } from '@/engine/signals/GameEvents';
import { getFXCode, getSoundCode } from '@/engine/signals/FastEventBus';

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
              this.events.emit(GameEvents.PLAYER_HIT, { damage: amount });
          },
          destroyEntity: (entity, fx, angle) => this.destroyEntity(entity, fx, angle),
          spawnFX: (type, x, y) => {
              const typeId = getFXCode(type);
              if (typeId) {
                  // NEW TYPED METHOD
                  this.fastEvents.spawnFX(typeId, x, y, 0);
              }
          },
          spawnImpact: (x, y, r, g, b, angle) => {
              const toHex = (c: number) => Math.floor(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, '0');
              const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
              this.events.emit(GameEvents.SPAWN_IMPACT, { x, y, hexColor, angle });
          },
          playAudio: (key) => {
              const keyId = getSoundCode(key.toLowerCase());
              if (keyId) {
                  // NEW TYPED METHOD
                  this.fastEvents.playSound(keyId, 0);
              }
          },
          playSpatialAudio: (key, x) => {
              const keyId = getSoundCode(key.toLowerCase());
              if (keyId) {
                  // NEW TYPED METHOD
                  this.fastEvents.playSound(keyId, x);
              }
          },
          addTrauma: (amount) => {
              // NEW TYPED METHOD
              this.fastEvents.camShake(amount);
          },
          flashEntity: (id) => {
              this.events.emit(GameEvents.ENEMY_DAMAGED, { id });
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
          
          const fxId = getFXCode(finalFX);
          if (fxId) {
              // NEW TYPED METHOD
              this.fastEvents.spawnFX(fxId, transform.x, transform.y, angleToUse);
          }
      }
  }

  teardown(): void {}
}
