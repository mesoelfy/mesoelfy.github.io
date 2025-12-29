import { IGameSystem } from '@/engine/interfaces';
import { RenderBuffer } from '@/engine/graphics/RenderBuffer';
import { RENDER_STRIDE, RenderOffset } from '@/engine/graphics/RenderSchema';
import { ARCHETYPES } from '@/engine/config/Archetypes';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { useStore } from '@/engine/state/global/useStore';

export class WarmupSystem implements IGameSystem {
  private renderKeys: string[] = [];
  private isWarmedUp = false;

  constructor() {
    // 1. Collect all unique RenderKeys from Archetypes
    const keys = new Set<string>();
    
    Object.values(ARCHETYPES).forEach(bp => {
        const render = bp.components.find(c => c.type === ComponentType.RenderModel);
        if (render && render.data) {
            const k = `${render.data.geometryId}|${render.data.materialId}`;
            keys.add(k);
        }
    });

    // Manually add Particles as they don't have an Archetype
    keys.add('GEO_PARTICLE|MAT_PARTICLE');

    this.renderKeys = Array.from(keys);
  }

  update(delta: number, time: number): void {
    const { bootState } = useStore.getState();
    
    // Only run during standby (Intro)
    if (bootState !== 'standby') {
        this.isWarmedUp = true;
        return;
    }

    // Inject 1 dummy instance for every known render group
    // Positioned far off-screen (y = -9000) so shaders compile but user sees nothing
    this.renderKeys.forEach(key => {
        const group = RenderBuffer.getGroup(key);
        const idx = group.count * RENDER_STRIDE;
        RenderBuffer.ensureCapacity(group, idx + RENDER_STRIDE);
        
        const buf = group.buffer;
        
        // Position: Far away
        buf[idx + RenderOffset.POSITION_X] = 0;
        buf[idx + RenderOffset.POSITION_Y] = -9000;
        buf[idx + RenderOffset.POSITION_Z] = 0;
        
        // Scale: Microscopic (Safety net)
        buf[idx + RenderOffset.SCALE_X] = 0.001;
        buf[idx + RenderOffset.SCALE_Y] = 0.001;
        buf[idx + RenderOffset.SCALE_Z] = 0.001;
        
        // Rotation: Identity
        buf[idx + RenderOffset.ROTATION_W] = 1;
        
        // Color: Black
        buf[idx + RenderOffset.COLOR_R] = 0;
        buf[idx + RenderOffset.COLOR_G] = 0;
        buf[idx + RenderOffset.COLOR_B] = 0;
        
        // Spawn Progress: 1 (Fully Visible to shader logic)
        buf[idx + RenderOffset.SPAWN_PROGRESS] = 1.0;

        group.count++;
    });
  }

  teardown(): void {}
}
