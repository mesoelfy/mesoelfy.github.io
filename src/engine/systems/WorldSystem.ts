import { IGameSystem, IPanelSystem, IEntityRegistry } from '@/engine/interfaces';
import { useStore } from '@/engine/state/global/useStore'; 
import { RenderData } from '@/engine/ecs/components/RenderData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { ComponentRegistry } from '@/engine/ecs/ComponentRegistry';
import { Tag } from '@/engine/ecs/types';
import * as THREE from 'three';

const COL_SAFE = new THREE.Color("#00FF41");
const COL_WARN = new THREE.Color("#FFD700");
const COL_CRIT = new THREE.Color("#FF003C");
const COL_SBX  = new THREE.Color("#00FFFF");

export class WorldSystem implements IGameSystem {
  private targetColor = new THREE.Color();
  private currentColor = new THREE.Color();
  private worldEntityId: number | null = null;

  constructor(
    private panelSystem: IPanelSystem,
    private registry: IEntityRegistry
  ) {
    this.ensureWorldEntity();
  }

  private ensureWorldEntity() {
      // Check if exists
      for(const e of this.registry.getByTag(Tag.WORLD)) {
          this.worldEntityId = e.id;
          return;
      }

      // Create if missing
      const world = this.registry.createEntity();
      world.addTag(Tag.WORLD);
      world.addComponent(ComponentRegistry.create(ComponentType.Render, { 
          r: 0, g: 0.2, b: 0, 
          visualScale: 1.0, 
          visualRotation: 0 
      }));
      this.registry.updateCache(world);
      this.worldEntityId = world.id;
  }

  update(delta: number, time: number): void {
    if (this.worldEntityId === null) return;
    
    const world = this.registry.getEntity(this.worldEntityId);
    if (!world || !world.active) return;

    const render = world.getComponent<RenderData>(ComponentType.Render);
    if (!render) return;

    const integrity = this.panelSystem.systemIntegrity;
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

  teardown(): void {}
}
