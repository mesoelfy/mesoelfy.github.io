import { IGameSystem, IEntityRegistry, IInteractionSystem, IGameStateSystem } from '@/engine/interfaces';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { RenderModel } from '@/engine/ecs/components/RenderModel';
import { StateColor } from '@/engine/ecs/components/StateColor';
import { Query } from '@/engine/ecs/Query';
import { useGameStore } from '@/engine/state/game/useGameStore';
import * as THREE from 'three';

export class RenderStateSystem implements IGameSystem {
  private tempColor = new THREE.Color();
  private targetColor = new THREE.Color(); 
  
  private renderQuery = new Query({ 
      all: [ComponentType.RenderModel] 
  });

  constructor(
    private registry: IEntityRegistry,
    private gameSystem: IGameStateSystem,
    private interactionSystem: IInteractionSystem
  ) {}

  update(delta: number, time: number): void {
    const isZenMode = useGameStore.getState().isZenMode;
    const isDead = this.gameSystem.playerHealth <= 0;
    const interactState = this.interactionSystem.repairState;

    const entities = this.registry.query(this.renderQuery);

    for (const entity of entities) {
      if (!entity.active) continue;

      const model = entity.getComponent<RenderModel>(ComponentType.RenderModel);
      const stateColor = entity.getComponent<StateColor>(ComponentType.StateColor);

      if (!model) continue;

      // --- SMOOTH COLOR LERP (Visual Only) ---
      if (stateColor) {
          let targetHex = stateColor.base;

          if (isDead && !isZenMode) {
              targetHex = stateColor.dead;
              if (interactState === 'REBOOTING') targetHex = stateColor.reboot;
          } else {
              if (interactState === 'HEALING') targetHex = stateColor.reboot; 
              else if (interactState === 'REBOOTING') targetHex = stateColor.reboot;
          }

          this.targetColor.set(targetHex);
          this.tempColor.setRGB(model.r, model.g, model.b);
          this.tempColor.lerp(this.targetColor, delta * 3.0);
          model.r = this.tempColor.r;
          model.g = this.tempColor.g;
          model.b = this.tempColor.b;
      }
    }
  }

  teardown(): void {}
}
