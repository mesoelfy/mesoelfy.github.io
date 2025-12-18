import { IGameSystem, IPanelSystem, IEntityRegistry } from '@/engine/interfaces';
import { useStore } from '@/engine/state/global/useStore'; 
import { RenderData } from '@/engine/ecs/components/RenderData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { Tag } from '@/engine/ecs/types';
import * as THREE from 'three';

const COL_SAFE = new THREE.Color("#00FF41");
const COL_WARN = new THREE.Color("#FFD700");
const COL_CRIT = new THREE.Color("#FF003C");
const COL_SBX  = new THREE.Color("#00FFFF");

export class AtmosphereSystem implements IGameSystem {
  private targetColor = new THREE.Color();
  private currentColor = new THREE.Color();

  constructor(
    private panelSystem: IPanelSystem,
    private registry: IEntityRegistry
  ) {}

  update(delta: number, time: number): void {
    const integrity = this.panelSystem.systemIntegrity;
    const worldEntities = this.registry.getByTag(Tag.WORLD);
    
    for (const world of worldEntities) {
        const render = world.getComponent<RenderData>(ComponentType.Render);
        if (render) {
            const bootState = useStore.getState().bootState;
            
            // 1. Determine Target Color
            if (bootState === 'sandbox') this.targetColor.copy(COL_SBX);
            else if (integrity < 30) this.targetColor.copy(COL_CRIT);
            else if (integrity < 60) this.targetColor.copy(COL_WARN);
            else this.targetColor.copy(COL_SAFE);

            // 2. Smooth Lerp
            this.currentColor.setRGB(render.r, render.g, render.b);
            this.currentColor.lerp(this.targetColor, delta * 2.0);
            
            render.r = this.currentColor.r;
            render.g = this.currentColor.g;
            render.b = this.currentColor.b;
            
            // 3. World Spin
            render.visualRotation += 0.5 * delta; 
        }
    }
  }

  teardown(): void {}
}
