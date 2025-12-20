import { IGameSystem, IEntityRegistry, IGameStateSystem, IInteractionSystem, IGameEventService } from '@/engine/interfaces';
import { RenderModel } from '@/engine/ecs/components/RenderModel';
import { RenderTransform } from '@/engine/ecs/components/RenderTransform';
import { RenderEffect } from '@/engine/ecs/components/RenderEffect';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { Tag } from '@/engine/ecs/types';
import { GAME_THEME } from '@/ui/sim/config/theme';
import { MaterialFactory } from '@/engine/graphics/MaterialFactory';
import { GameEvents } from '@/engine/signals/GameEvents';
import { VISUAL_CONFIG } from '@/engine/config/VisualConfig';
import { useGameStore } from '@/engine/state/game/useGameStore';
import * as THREE from 'three';

const COL_BASE = new THREE.Color(GAME_THEME.turret.base);
const COL_REPAIR = new THREE.Color(GAME_THEME.turret.repair);
const COL_REBOOT = new THREE.Color('#9E4EA5');
const COL_DEAD = new THREE.Color('#FF003C');

export class RenderSystem implements IGameSystem {
  private tempColor = new THREE.Color();

  constructor(
    private registry: IEntityRegistry,
    private gameSystem: IGameStateSystem,
    private interactionSystem: IInteractionSystem,
    events: IGameEventService
  ) {
    events.subscribe(GameEvents.ENEMY_DAMAGED, (p) => {
        const entity = this.registry.getEntity(p.id);
        if (entity) {
            const effect = entity.getComponent<RenderEffect>(ComponentType.RenderEffect);
            if (effect) effect.flash = 1.0; 
        }
    });
  }

  update(delta: number, time: number): void {
    MaterialFactory.updateUniforms(time);
    const CFG = VISUAL_CONFIG.RENDER;

    const entities = this.registry.query({ all: [ComponentType.RenderModel] });
    const interactState = this.interactionSystem.repairState;
    const isDead = this.gameSystem.playerHealth <= 0;
    const isZenMode = useGameStore.getState().isZenMode;

    for (const entity of entities) {
        if (!entity.active) continue;
        
        const model = entity.getComponent<RenderModel>(ComponentType.RenderModel);
        const transform = entity.getComponent<RenderTransform>(ComponentType.RenderTransform);
        const effect = entity.getComponent<RenderEffect>(ComponentType.RenderEffect);
        const identity = entity.getComponent<IdentityData>(ComponentType.Identity);
        
        if (!model) continue;

        const isPlayer = entity.hasTag(Tag.PLAYER) && (!identity || identity.variant === 'PLAYER');
        
        if (isPlayer) {
            let targetCol = COL_BASE;
            let spinSpeed = 0.02; 

            if (isZenMode) {
                // Zen Mode: Ultra slow rotation (50% of previous 0.06)
                spinSpeed = -0.03;
            } else if (isDead) {
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

            this.tempColor.setRGB(model.r, model.g, model.b);
            this.tempColor.lerp(targetCol, delta * 3.0);
            model.r = this.tempColor.r;
            model.g = this.tempColor.g;
            model.b = this.tempColor.b;
            
            if (transform) {
                transform.rotation += spinSpeed;
                transform.scale = 1.0;
            }
        }
        else if (effect) {
            if (effect.shudder > 0) {
                effect.shudder = Math.max(0, effect.shudder - (delta * CFG.SHUDDER_DECAY));
            }

            if (effect.flash > 0) {
                effect.flash = Math.max(0, effect.flash - (delta * CFG.FLASH_DECAY));
                
                if (transform) {
                    transform.scale = 1.0 + (effect.flash * 0.25);
                }
            } else {
                if (transform && transform.scale !== 1.0) transform.scale = 1.0;
            }
        }
    }
  }

  teardown(): void {}
}
