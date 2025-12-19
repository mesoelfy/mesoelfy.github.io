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
import { FastEvents, REVERSE_FX_MAP, REVERSE_SOUND_MAP } from '@/engine/signals/FastEventBus';

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
              // Game Logic still goes to Slow Bus (UI needs it)
              this.events.emit(GameEvents.PLAYER_HIT, { damage: amount });
          },
          destroyEntity: (entity, fx, angle) => this.destroyEntity(entity, fx, angle),
          spawnFX: (type, x, y) => {
              // FAST PATH: Zero-Alloc
              const typeId = REVERSE_FX_MAP[type];
              if (typeId) {
                  this.fastEvents.emit(FastEvents.SPAWN_FX, typeId, x * 100, y * 100, 0);
              }
          },
          spawnImpact: (x, y, r, g, b, angle) => {
              // Keep legacy event for dynamic color impacts (complex payload)
              const toHex = (c: number) => Math.floor(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, '0');
              const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
              this.events.emit(GameEvents.SPAWN_IMPACT, { x, y, hexColor, angle });
          },
          playAudio: (key) => {
              const keyId = REVERSE_SOUND_MAP[key.toLowerCase()];
              if (keyId) this.fastEvents.emit(FastEvents.PLAY_SOUND, keyId, 0);
          },
          playSpatialAudio: (key, x) => {
              const keyId = REVERSE_SOUND_MAP[key.toLowerCase()];
              if (keyId) {
                  this.fastEvents.emit(FastEvents.PLAY_SOUND, keyId, (x || 0) * 100);
              }
          },
          addTrauma: (amount) => {
              this.fastEvents.emit(FastEvents.CAM_SHAKE, amount * 100);
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
          
          // Dynamic overrides based on type
          if (identity?.variant === EnemyTypes.HUNTER) {
              finalFX = impactAngle !== undefined ? 'EXPLOSION_YELLOW_DIR' : 'EXPLOSION_YELLOW';
          }
          else if (identity?.variant === EnemyTypes.KAMIKAZE) {
              finalFX = impactAngle !== undefined ? 'EXPLOSION_RED_DIR' : 'EXPLOSION_RED';
          }
          else if (identity?.variant === EnemyTypes.DRILLER) {
              finalFX = impactAngle !== undefined ? 'EXPLOSION_PURPLE_DIR' : 'EXPLOSION_PURPLE';
          }
          
          const fxId = REVERSE_FX_MAP[finalFX];
          if (fxId) {
              this.fastEvents.emit(FastEvents.SPAWN_FX, fxId, transform.x * 100, transform.y * 100, angleToUse * 100);
          }
      }
  }

  teardown(): void {}
}
