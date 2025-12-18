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

export class RenderSystem implements IGameSystem {
  private tempColor = new THREE.Color();
  private readonly FLASH_DECAY = 5.0; 
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
            // a1 = entityID
            const entity = this.registry.getEntity(a1);
            if (entity) {
                const render = entity.getComponent<RenderData>(ComponentType.Render);
                if (render) {
                    render.r = 2.0; 
                    render.g = 2.0;
                    render.b = 2.0;
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
            if (render.r > render.baseR || render.g > render.baseG || render.b > render.baseB) {
                render.r = this.lerp(render.r, render.baseR, delta * this.FLASH_DECAY);
                render.g = this.lerp(render.g, render.baseG, delta * this.FLASH_DECAY);
                render.b = this.lerp(render.b, render.baseB, delta * this.FLASH_DECAY);
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
      return start * (1 - t) + end * t;
  }

  teardown(): void {}
}
