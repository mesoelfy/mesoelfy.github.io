import { IGameSystem, IEntityRegistry, IInteractionSystem, IVitalsRead, IGameEventService } from '@/engine/interfaces';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { RenderEffect } from '@/engine/ecs/components/RenderEffect';
import { RenderTransform } from '@/engine/ecs/components/RenderTransform';
import { AutoRotate } from '@/engine/ecs/components/AutoRotate';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { VISUAL_CONFIG } from '@/engine/config/VisualConfig';
import { Query } from '@/engine/ecs/Query';
import { Tag } from '@/engine/ecs/types';
import { AI_STATE } from '@/engine/ai/AIStateTypes';
import { PanelId } from '@/engine/config/PanelConfig';
import { UnifiedEventService } from '@/engine/signals/UnifiedEventService';
import { FastEventType } from '@/engine/signals/FastEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import * as THREE from 'three';

export class VisualStateSystem implements IGameSystem {
  private effectQuery = new Query({ all: [ComponentType.RenderEffect] });
  private rotateQuery = new Query({ all: [ComponentType.RenderTransform] });

  private isZenMode = false;
  private unsubs: (() => void)[] = [];

  constructor(
    private registry: IEntityRegistry,
    private vitals: IVitalsRead,
    private interactionSystem: IInteractionSystem,
    private events: IGameEventService
  ) {
      this.unsubs.push(this.events.subscribe(GameEvents.GLOBAL_STATE_SYNC, (p) => {
          this.isZenMode = p.isZenMode;
      }));
  }

  update(delta: number, time: number): void {
    const RENDER_CFG = VISUAL_CONFIG.RENDER;
    const SPAWN_CFG = VISUAL_CONFIG.SPAWN;

    const unified = this.events as UnifiedEventService;
    if (unified && typeof unified.processFastEvents === 'function') {
        unified.processFastEvents((id, a1) => {
            if (id === FastEventType.ENTITY_FLASH) {
                const entity = this.registry.getEntity(a1);
                if (entity) {
                    const effect = entity.getComponent<RenderEffect>(ComponentType.RenderEffect);
                    if (effect) effect.flash = 1.0; 
                }
            }
        });
    }

    const isDead = this.vitals.playerHealth <= 0;
    const interactState = this.interactionSystem.repairState;
    const hoverId = this.interactionSystem.hoveringPanelId;

    const effectEntities = this.registry.query(this.effectQuery);
    for (const entity of effectEntities) {
      if (!entity.active) continue;
      const effect = entity.getComponent<RenderEffect>(ComponentType.RenderEffect)!;
      const render = entity.getComponent<RenderTransform>(ComponentType.RenderTransform);
      
      if (effect.flash > 0) {
        effect.flash = Math.max(0, effect.flash - (delta * RENDER_CFG.FLASH_DECAY));
      }
      if (effect.shudder > 0) {
        effect.shudder = Math.max(0, effect.shudder - (delta * RENDER_CFG.SHUDDER_DECAY));
      }
      if (effect.spawnProgress < 1.0 && effect.spawnVelocity > 0) {
        effect.spawnProgress = Math.min(1.0, effect.spawnProgress + (effect.spawnVelocity * delta));
        
        if (render) {
            const scaleCurve = effect.spawnProgress; 
            render.rotation += (1.0 - scaleCurve) * SPAWN_CFG.ROTATION_SPEED * delta;
        }
      }
      if (effect.spawnProgress >= 1.0) {
        const aiState = entity.getComponent<AIStateData>(ComponentType.State);
        const targetSquash = (aiState && aiState.current === AI_STATE.CHARGING) ? 1.0 : 0.0;
        effect.squashFactor = THREE.MathUtils.lerp(effect.squashFactor, targetSquash, delta * 8.0);
      }
    }

    const rotateEntities = this.registry.query(this.rotateQuery);
    for (const entity of rotateEntities) {
      if (!entity.active) continue;
      const render = entity.getComponent<RenderTransform>(ComponentType.RenderTransform)!;
      const rotate = entity.getComponent<AutoRotate>(ComponentType.AutoRotate);
      
      if (rotate) {
        render.rotation += rotate.speed * delta;
      }

      if (entity.hasTag(Tag.PLAYER) && !entity.hasTag(Tag.PROJECTILE)) {
        let spinSpeed = 0.02; 
        if (this.isZenMode) spinSpeed = -0.03;
        else if (isDead) spinSpeed = interactState === 'REBOOTING' ? -0.3 : 1.5;
        else if (interactState === 'HEALING' || interactState === 'REBOOTING') {
          const isSelf = hoverId === PanelId.IDENTITY;
          spinSpeed = isSelf ? -0.4 : -0.24;
        }
        render.rotation += spinSpeed * (delta * 60); 
      }
    }
  }

  teardown(): void {
      this.unsubs.forEach(u => u());
      this.unsubs = [];
  }
}
