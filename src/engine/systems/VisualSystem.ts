import { IGameSystem, IEntityRegistry, IInteractionSystem, IGameStateSystem, IGameEventService } from '@/engine/interfaces';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { RenderModel } from '@/engine/ecs/components/RenderModel';
import { RenderTransform } from '@/engine/ecs/components/RenderTransform';
import { RenderEffect } from '@/engine/ecs/components/RenderEffect';
import { MotionData } from '@/engine/ecs/components/MotionData';
import { AutoRotate } from '@/engine/ecs/components/AutoRotate';
import { StateColor } from '@/engine/ecs/components/StateColor';
import { VISUAL_CONFIG } from '@/engine/config/VisualConfig';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { Query } from '@/engine/ecs/Query';
import { UnifiedEventService } from '@/engine/signals/UnifiedEventService';
import { FastEventType } from '@/engine/signals/FastEventBus';
import * as THREE from 'three';

function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  if (t === 0) return 0;
  if (t === 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

export class VisualSystem implements IGameSystem {
  private tempColor = new THREE.Color();
  
  // CACHED QUERY
  private visualQuery = new Query({ all: [ComponentType.RenderTransform] });

  constructor(
    private registry: IEntityRegistry,
    private gameSystem: IGameStateSystem,
    private interactionSystem: IInteractionSystem,
    private events: IGameEventService
  ) {
    // Removed slow subscription to ENEMY_DAMAGED
  }

  update(delta: number, time: number): void {
    // 1. POLL FAST BUS FOR FLASH EVENTS
    const unified = this.events as UnifiedEventService;
    if (unified && typeof unified.processFastEvents === 'function') {
        unified.processFastEvents((id, a1) => {
            if (id === FastEventType.ENTITY_FLASH) {
                const entityId = a1;
                const entity = this.registry.getEntity(entityId);
                if (entity) {
                    const effect = entity.getComponent<RenderEffect>(ComponentType.RenderEffect);
                    if (effect) effect.flash = 1.0; 
                }
            }
        });
    }

    const CFG = VISUAL_CONFIG.DEFORMATION;
    const SPAWN_CFG = VISUAL_CONFIG.SPAWN;
    const RENDER_CFG = VISUAL_CONFIG.RENDER;
    
    const isZenMode = useGameStore.getState().isZenMode;
    const isDead = this.gameSystem.playerHealth <= 0;
    const interactState = this.interactionSystem.repairState;

    const entities = this.registry.query(this.visualQuery);

    for (const entity of entities) {
      if (!entity.active) continue;

      const render = entity.getComponent<RenderTransform>(ComponentType.RenderTransform);
      const effect = entity.getComponent<RenderEffect>(ComponentType.RenderEffect);
      const motion = entity.getComponent<MotionData>(ComponentType.Motion);
      const rotate = entity.getComponent<AutoRotate>(ComponentType.AutoRotate);
      const stateColor = entity.getComponent<StateColor>(ComponentType.StateColor);
      const model = entity.getComponent<RenderModel>(ComponentType.RenderModel);

      if (!render) continue;

      // 1. AUTO ROTATION (Base)
      if (rotate) {
          render.rotation += rotate.speed * delta;
      }

      // 2. STATE COLORING & ANIMATION
      if (stateColor && model) {
          let targetHex = stateColor.base;
          let spinSpeed = 0.02;

          if (isZenMode) {
              spinSpeed = -0.03;
          } else if (isDead) {
              targetHex = stateColor.dead;
              spinSpeed = interactState === 'REBOOTING' ? -0.3 : 1.5;
              if (interactState === 'REBOOTING') targetHex = stateColor.reboot;
          } else {
              // Standard Gameplay
              if (interactState === 'HEALING') {
                  // CHANGE: Projectiles (derived from model color) now match Reboot (Purple)
                  // Reticle visual (PlayerActor) remains Pink/Repair color independently
                  targetHex = stateColor.reboot; 
                  spinSpeed = -0.24; 
              } else if (interactState === 'REBOOTING') {
                  targetHex = stateColor.reboot;
                  spinSpeed = -0.24; 
              }
          }

          render.rotation += spinSpeed;
          render.scale = 1.0; 

          const c = new THREE.Color(targetHex);
          this.tempColor.setRGB(model.r, model.g, model.b);
          this.tempColor.lerp(c, delta * 3.0);
          model.r = this.tempColor.r;
          model.g = this.tempColor.g;
          model.b = this.tempColor.b;
      }

      // 3. DYNAMIC SCALING & SPAWNING
      let dX = 1.0, dY = 1.0, dZ = 1.0;

      if (effect) {
          if (effect.spawnProgress < 1.0) {
              if (effect.spawnVelocity > 0) {
                  effect.spawnProgress = Math.min(1.0, effect.spawnProgress + (effect.spawnVelocity * delta));
              }

              const t = effect.spawnProgress;
              const scaleCurve = easeOutElastic(t);
              
              dX *= scaleCurve;
              dY *= scaleCurve;
              dZ *= scaleCurve;

              render.rotation += (1.0 - scaleCurve) * SPAWN_CFG.ROTATION_SPEED * delta;
              
              const riseT = t * (2 - t); 
              render.offsetY = SPAWN_CFG.Y_OFFSET * (1.0 - riseT);

          } else {
              render.offsetY = 0;
          }

          if (effect.shudder > 0) effect.shudder = Math.max(0, effect.shudder - (delta * RENDER_CFG.SHUDDER_DECAY));
          if (effect.flash > 0) {
              effect.flash = Math.max(0, effect.flash - (delta * RENDER_CFG.FLASH_DECAY));
              const bump = effect.flash * 0.25;
              dX += bump; dY += bump; dZ += bump;
          }

          if (effect.pulseSpeed > 0) {
              const pulse = Math.sin(time * effect.pulseSpeed) * 0.2;
              dX += pulse; dY += pulse; dZ += pulse;
          }

          if (motion && effect.elasticity > 0.01 && effect.spawnProgress >= 1.0) {
              const speedSq = motion.vx * motion.vx + motion.vy * motion.vy;
              const threshold = effect.elasticity > 1.0 ? 1.0 : 4.0;

              if (speedSq > threshold) {
                  const speed = Math.sqrt(speedSq);
                  let stretchY = 1.0, squashXZ = 1.0;
                  
                  if (effect.elasticity > 1.0) {
                      stretchY = Math.min(CFG.MAX_STRETCH_CAP, 1.0 + (speed * CFG.BASE_STRETCH * effect.elasticity));
                      squashXZ = Math.max(CFG.MIN_SQUASH_CAP, 1.0 - (speed * CFG.BASE_SQUASH * effect.elasticity));
                  } else {
                      stretchY = Math.min(CFG.MAX_STRETCH, 1.0 + (speed * CFG.STRETCH_FACTOR));
                      squashXZ = Math.max(CFG.MIN_SQUASH, 1.0 - (speed * CFG.SQUASH_FACTOR));
                  }
                  
                  dY *= stretchY;
                  dX *= squashXZ;
                  dZ *= squashXZ;
              }
          }
      }

      render.dynamicScaleX = dX;
      render.dynamicScaleY = dY;
      render.dynamicScaleZ = dZ;
    }
  }

  teardown(): void {}
}
