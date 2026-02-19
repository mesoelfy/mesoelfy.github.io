import { IGameSystem, IEntityRegistry, IGameEventService, IInteractionSystem, IGameStateSystem } from '@/engine/interfaces';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { RenderModel } from '@/engine/ecs/components/RenderModel';
import { RenderEffect } from '@/engine/ecs/components/RenderEffect';
import { StateColor } from '@/engine/ecs/components/StateColor';
import { Query } from '@/engine/ecs/Query';
import { UnifiedEventService } from '@/engine/signals/UnifiedEventService';
import { FastEventType } from '@/engine/signals/FastEventBus';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { VISUAL_CONFIG } from '@/engine/config/VisualConfig';
import * as THREE from 'three';

export class RenderStateSystem implements IGameSystem {
  private tempColor = new THREE.Color();
  private targetColor = new THREE.Color(); // <-- ZERO ALLOCATION FIX
  
  // Cached Query for entities with visual components
  private renderQuery = new Query({ 
      all: [ComponentType.RenderModel] 
  });

  constructor(
    private registry: IEntityRegistry,
    private gameSystem: IGameStateSystem,
    private interactionSystem: IInteractionSystem,
    private events: IGameEventService
  ) {}

  update(delta: number, time: number): void {
    // 1. POLL FAST BUS FOR FLASH EVENTS (Damage Feedback)
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

    const RENDER_CFG = VISUAL_CONFIG.RENDER;
    const isZenMode = useGameStore.getState().isZenMode;
    const isDead = this.gameSystem.playerHealth <= 0;
    const interactState = this.interactionSystem.repairState;

    const entities = this.registry.query(this.renderQuery);

    for (const entity of entities) {
      if (!entity.active) continue;

      const model = entity.getComponent<RenderModel>(ComponentType.RenderModel);
      const stateColor = entity.getComponent<StateColor>(ComponentType.StateColor);
      const effect = entity.getComponent<RenderEffect>(ComponentType.RenderEffect);

      if (!model) continue;

      // --- STATE COLORING ---
      if (stateColor) {
          let targetHex = stateColor.base;

          if (isDead && !isZenMode) {
              targetHex = stateColor.dead;
              if (interactState === 'REBOOTING') targetHex = stateColor.reboot;
          } else {
              // Standard Gameplay Interactions
              if (interactState === 'HEALING') {
                  targetHex = stateColor.reboot; 
              } else if (interactState === 'REBOOTING') {
                  targetHex = stateColor.reboot;
              }
          }

          // ZERO ALLOCATION UPDATE
          this.targetColor.set(targetHex);
          this.tempColor.setRGB(model.r, model.g, model.b);
          this.tempColor.lerp(this.targetColor, delta * 3.0);
          model.r = this.tempColor.r;
          model.g = this.tempColor.g;
          model.b = this.tempColor.b;
      }

      // --- FLASH EFFECT DECAY ---
      if (effect) {
          if (effect.flash > 0) {
              // Decay the flash value
              effect.flash = Math.max(0, effect.flash - (delta * RENDER_CFG.FLASH_DECAY));
          }
          if (effect.shudder > 0) {
              effect.shudder = Math.max(0, effect.shudder - (delta * RENDER_CFG.SHUDDER_DECAY));
          }
      }
    }
  }

  teardown(): void {}
}
