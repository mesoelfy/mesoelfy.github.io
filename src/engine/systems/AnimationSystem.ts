import { IGameSystem, IEntityRegistry, IInteractionSystem, IGameStateSystem } from '@/engine/interfaces';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { RenderTransform } from '@/engine/ecs/components/RenderTransform';
import { RenderEffect } from '@/engine/ecs/components/RenderEffect';
import { MotionData } from '@/engine/ecs/components/MotionData';
import { AutoRotate } from '@/engine/ecs/components/AutoRotate';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { VISUAL_CONFIG } from '@/engine/config/VisualConfig';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { Query } from '@/engine/ecs/Query';
import { AI_STATE } from '@/engine/ai/AIStateTypes';
import { PanelId } from '@/engine/config/PanelConfig';
import * as THREE from 'three';

function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  if (t === 0) return 0;
  if (t === 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

export class AnimationSystem implements IGameSystem {
  private animationQuery = new Query({ 
      all: [ComponentType.RenderTransform] 
  });

  constructor(
    private registry: IEntityRegistry,
    private gameSystem: IGameStateSystem,
    private interactionSystem: IInteractionSystem
  ) {}

  update(delta: number, time: number): void {
    const CFG = VISUAL_CONFIG.DEFORMATION;
    const SPAWN_CFG = VISUAL_CONFIG.SPAWN;
    
    const isZenMode = useGameStore.getState().isZenMode;
    const isDead = this.gameSystem.playerHealth <= 0;
    const interactState = this.interactionSystem.repairState;
    const hoverId = this.interactionSystem.hoveringPanelId;

    const entities = this.registry.query(this.animationQuery);

    for (const entity of entities) {
      if (!entity.active) continue;

      const render = entity.getComponent<RenderTransform>(ComponentType.RenderTransform);
      const effect = entity.getComponent<RenderEffect>(ComponentType.RenderEffect);
      const motion = entity.getComponent<MotionData>(ComponentType.Motion);
      const rotate = entity.getComponent<AutoRotate>(ComponentType.AutoRotate);
      const aiState = entity.getComponent<AIStateData>(ComponentType.State);

      if (!render) continue;

      // 1. ROTATION LOGIC
      if (rotate) {
          render.rotation += rotate.speed * delta;
      }

      // State-based spin overrides (Player/Interaction)
      if (entity.hasTag('PLAYER')) {
          // Default Idle Spin
          let spinSpeed = 0.02; 

          if (isZenMode) {
              spinSpeed = -0.03;
          } else if (isDead) {
              // Dead but Reviving = Fast Spin
              spinSpeed = interactState === 'REBOOTING' ? -0.3 : 1.5;
          } else if (interactState === 'HEALING' || interactState === 'REBOOTING') {
              // Healing Self or Panel = Fast Spin
              // Maybe faster for self-heal?
              const isSelf = hoverId === PanelId.IDENTITY;
              spinSpeed = isSelf ? -0.4 : -0.24;
          }
          
          render.rotation += spinSpeed;
      }

      // 2. SCALE & DEFORMATION
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

          if (effect.flash > 0) {
              const bump = effect.flash * 0.25;
              dX += bump; dY += bump; dZ += bump;
          }

          if (effect.pulseSpeed > 0) {
              const pulse = Math.sin(time * effect.pulseSpeed) * 0.2;
              dX += pulse; dY += pulse; dZ += pulse;
          }

          if (effect.spawnProgress >= 1.0) {
              let targetSquash = 0.0;
              if (aiState && aiState.current === AI_STATE.CHARGING) {
                  targetSquash = 1.0;
              }

              effect.squashFactor = THREE.MathUtils.lerp(effect.squashFactor, targetSquash, delta * 8.0);

              if (effect.squashFactor > 0.01) {
                  const compression = 0.4 * effect.squashFactor; 
                  const expansion = 0.8 * effect.squashFactor;   

                  dY *= (1.0 - compression); 
                  dX *= (1.0 + expansion);   
                  dZ *= (1.0 + expansion);   
              } 
              else if (motion && effect.elasticity > 0.01) {
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
      }

      render.dynamicScaleX = dX;
      render.dynamicScaleY = dY;
      render.dynamicScaleZ = dZ;
    }
  }

  teardown(): void {}
}
