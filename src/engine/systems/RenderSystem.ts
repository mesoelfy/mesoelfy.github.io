import { IGameSystem, IEntityRegistry, IGameStateSystem, IInteractionSystem, IGameEventService } from '@/engine/interfaces';
import { RenderData } from '@/engine/ecs/components/RenderData';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { Tag } from '@/engine/ecs/types';
import { GAME_THEME } from '@/ui/sim/config/theme';
import { MaterialFactory } from '@/engine/graphics/MaterialFactory';
import { GameEvents } from '@/engine/signals/GameEvents';
import * as THREE from 'three';

const COL_BASE = new THREE.Color(GAME_THEME.turret.base);
const COL_REPAIR = new THREE.Color(GAME_THEME.turret.repair);
const COL_REBOOT = new THREE.Color('#9E4EA5');
const COL_DEAD = new THREE.Color('#FF003C');

const FLASH_COLOR = { r: 4.0, g: 0.0, b: 0.2 }; 

export class RenderSystem implements IGameSystem {
  private tempColor = new THREE.Color();
  private readonly FLASH_DECAY = 6.0; 
  private readonly SHUDDER_DECAY = 15.0; 

  constructor(
    private registry: IEntityRegistry,
    private gameSystem: IGameStateSystem,
    private interactionSystem: IInteractionSystem,
    events: IGameEventService
  ) {
    events.subscribe(GameEvents.ENEMY_DAMAGED, (p) => {
        const entity = this.registry.getEntity(p.id);
        if (entity) {
            const render = entity.getComponent<RenderData>(ComponentType.Render);
            if (render) render.flash = 1.0; 
        }
    });
  }

  update(delta: number, time: number): void {
    MaterialFactory.updateUniforms(time);

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
            if (render.shudder > 0) {
                render.shudder = Math.max(0, render.shudder - (delta * this.SHUDDER_DECAY));
            }

            if (render.flash > 0) {
                render.flash = Math.max(0, render.flash - (delta * this.FLASH_DECAY));
                
                const heatR = (render.baseR * 2.0) + 0.5;
                const heatG = (render.baseG * 2.0) + 0.5;
                const heatB = (render.baseB * 2.0) + 0.5;

                let targetR, targetG, targetB;

                if (render.flash > 0.4) {
                    const t = (render.flash - 0.4) / 0.6;
                    const ease = t * (2 - t); 
                    
                    targetR = this.lerp(heatR, FLASH_COLOR.r, ease);
                    targetG = this.lerp(heatG, FLASH_COLOR.g, ease);
                    targetB = this.lerp(heatB, FLASH_COLOR.b, ease);
                } else {
                    const t = render.flash / 0.4;
                    const ease = t * t; 

                    targetR = this.lerp(render.baseR, heatR, ease);
                    targetG = this.lerp(render.baseG, heatG, ease);
                    targetB = this.lerp(render.baseB, heatB, ease);
                }
                
                render.r = targetR;
                render.g = targetG;
                render.b = targetB;
                
                render.visualScale = 1.0 + (render.flash * 0.25); 
            } else {
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
