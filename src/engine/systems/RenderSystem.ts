import { IGameSystem, IEntityRegistry, IGameStateSystem, IInteractionSystem } from '@/engine/interfaces';
import { RenderData } from '@/engine/ecs/components/RenderData';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { Tag } from '@/engine/ecs/types';
import { GAME_THEME } from '@/ui/sim/config/theme';
import { MaterialFactory } from '@/engine/graphics/MaterialFactory';
import { FastEvents } from '@/engine/signals/FastEventBus';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { EventReader } from '@/engine/signals/EventReader';
import * as THREE from 'three';

const COL_BASE = new THREE.Color(GAME_THEME.turret.base);
const COL_REPAIR = new THREE.Color(GAME_THEME.turret.repair);
const COL_REBOOT = new THREE.Color('#9E4EA5');
const COL_DEAD = new THREE.Color('#FF003C');

// High Intensity Red for Damage Flash
const FLASH_COLOR = { r: 4.0, g: 0.0, b: 0.2 }; 

export class RenderSystem implements IGameSystem {
  private tempColor = new THREE.Color();
  // Slightly slower decay to allow the 2-stage animation to be seen
  private readonly FLASH_DECAY = 6.0; 
  private reader: EventReader;

  constructor(
    private registry: IEntityRegistry,
    private gameSystem: IGameStateSystem,
    private interactionSystem: IInteractionSystem
  ) {
    this.reader = new EventReader(ServiceLocator.getFastEventBus());
  }

  update(delta: number, time: number): void {
    MaterialFactory.updateUniforms(time);

    // Process Hit Flashes
    this.reader.process((id, a1) => {
        if (id === FastEvents.ENEMY_DAMAGED) {
            const entity = this.registry.getEntity(a1);
            if (entity) {
                const render = entity.getComponent<RenderData>(ComponentType.Render);
                if (render) {
                    render.flash = 1.0; // Trigger Flash
                }
            }
        }
    });

    const renderables = this.registry.query({ all: [ComponentType.Render] });
    const interactState = this.interactionSystem.repairState;
    const isDead = this.gameSystem.playerHealth <= 0;

    for (const entity of renderables) {
        if (!entity.active) continue;
        
        const render = entity.getComponent<RenderData>(ComponentType.Render);
        const identity = entity.getComponent<IdentityData>(ComponentType.Identity);
        
        if (!render) continue;

        const isPlayer = entity.hasTag(Tag.PLAYER) && (!identity || identity.variant === 'PLAYER');
        
        if (isPlayer) {
            this.updatePlayerVisuals(render, delta, interactState, isDead);
        }
        else {
            // --- ENEMY 2-STAGE FLASH LOGIC ---
            if (render.flash > 0) {
                render.flash = Math.max(0, render.flash - (delta * this.FLASH_DECAY));
                
                // Calculate "Heated Base" (Bright + Desaturated)
                // We add 0.5 to RGB to tint it white, and multiply base by 2.0 for intensity
                const heatR = (render.baseR * 2.0) + 0.5;
                const heatG = (render.baseG * 2.0) + 0.5;
                const heatB = (render.baseB * 2.0) + 0.5;

                let targetR, targetG, targetB;

                // Split the flash timeline into two halves
                if (render.flash > 0.4) {
                    // STAGE 1: Transition from RED -> HEATED BASE
                    // Normalize 0.4..1.0 range to 0.0..1.0
                    const t = (render.flash - 0.4) / 0.6;
                    // Ease out to make the Red punchy
                    const ease = t * (2 - t); 
                    
                    targetR = this.lerp(heatR, FLASH_COLOR.r, ease);
                    targetG = this.lerp(heatG, FLASH_COLOR.g, ease);
                    targetB = this.lerp(heatB, FLASH_COLOR.b, ease);
                } else {
                    // STAGE 2: Transition from HEATED BASE -> NORMAL BASE
                    // Normalize 0.0..0.4 range to 0.0..1.0
                    const t = render.flash / 0.4;
                    // Ease in to settle smoothly
                    const ease = t * t; 

                    targetR = this.lerp(render.baseR, heatR, ease);
                    targetG = this.lerp(render.baseG, heatG, ease);
                    targetB = this.lerp(render.baseB, heatB, ease);
                }
                
                render.r = targetR;
                render.g = targetG;
                render.b = targetB;
                
                // Pop scale 
                render.visualScale = 1.0 + (render.flash * 0.25); 
            } else {
                // Optimization: Lock to base if idle
                if (render.r !== render.baseR) render.r = render.baseR;
                if (render.g !== render.baseG) render.g = render.baseG;
                if (render.b !== render.baseB) render.b = render.baseB;
                if (render.visualScale !== 1.0) render.visualScale = 1.0;
            }
        }
    }
  }

  private updatePlayerVisuals(render: RenderData, delta: number, interactState: string, isDead: boolean) {
      let targetCol = COL_BASE;
      let spinSpeed = 0.02; 

      if (isDead) {
          targetCol = COL_DEAD;
          if (interactState === 'REBOOTING') {
              targetCol = COL_REBOOT;
              spinSpeed = -0.3; 
          } else {
              spinSpeed = 1.5; 
          }
      } else {
          if (interactState === 'HEALING') {
              targetCol = COL_REPAIR;
              spinSpeed = -0.24;
          } else if (interactState === 'REBOOTING') {
              targetCol = COL_REBOOT;
              spinSpeed = -0.24;
          }
      }

      this.tempColor.setRGB(render.r, render.g, render.b);
      this.tempColor.lerp(targetCol, delta * 3.0);
      render.r = this.tempColor.r;
      render.g = this.tempColor.g;
      render.b = this.tempColor.b;
      
      render.visualRotation += spinSpeed;
      render.visualScale = 1.0;
  }

  private lerp(start: number, end: number, t: number) {
      return start + (end - start) * t;
  }

  teardown(): void {}
}
