import { IGameSystem, IEntityRegistry } from '@/engine/interfaces';
import { RenderBuffer } from '@/engine/graphics/RenderBuffer';
import { RenderOffset, RENDER_STRIDE } from '@/engine/graphics/RenderSchema';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { RenderModel } from '@/engine/ecs/components/RenderModel';
import { RenderTransform } from '@/engine/ecs/components/RenderTransform';
import { RenderEffect } from '@/engine/ecs/components/RenderEffect';
import { MaterialFactory } from '@/engine/graphics/MaterialFactory';
import { Query } from '@/engine/ecs/Query';
import * as THREE from 'three';

const axisY = new THREE.Vector3(0, 1, 0); 
const axisZ = new THREE.Vector3(0, 0, 1); 
const qSpin = new THREE.Quaternion();
const qAim = new THREE.Quaternion();
const qFinal = new THREE.Quaternion();

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const lerpAngle = (a: number, b: number, t: number) => {
    const diff = b - a;
    // Normalize diff to -PI to +PI
    const d = ((diff % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    return a + d * t;
};

export class RenderSystem implements IGameSystem {
  // CACHED QUERY
  private renderQuery = new Query({ 
      all: [ComponentType.Transform, ComponentType.RenderModel] 
  });

  constructor(private registry: IEntityRegistry) {}

  update(delta: number, time: number, alpha: number = 1.0): void {
    MaterialFactory.updateUniforms(time);
    RenderBuffer.reset();

    // Use cached query
    const entities = this.registry.query(this.renderQuery);

    for (const entity of entities) {
      if (!entity.active) continue;

      const transform = entity.getComponent<TransformData>(ComponentType.Transform);
      const model = entity.getComponent<RenderModel>(ComponentType.RenderModel);
      const visual = entity.getComponent<RenderTransform>(ComponentType.RenderTransform);
      const effect = entity.getComponent<RenderEffect>(ComponentType.RenderEffect);

      if (!transform || !model) continue;

      const key = `${model.geometryId}|${model.materialId}`;
      const group = RenderBuffer.getGroup(key);
      const idx = group.count * RENDER_STRIDE;
      
      RenderBuffer.ensureCapacity(group, idx + RENDER_STRIDE);

      // --- 1. Position (Interpolated) ---
      let vx = lerp(transform.prevX, transform.x, alpha);
      let vy = lerp(transform.prevY, transform.y, alpha);
      const vz = visual ? visual.offsetZ : 0;
      
      if (effect && effect.shudder > 0) {
          const shake = effect.shudder * 0.2; 
          vx += (Math.random() - 0.5) * shake;
          vy += (Math.random() - 0.5) * shake;
      }

      if (visual) {
          vx += visual.offsetX;
          vy += visual.offsetY;
      }

      // --- 2. Scale (Interpolated) ---
      let baseScale = lerp(transform.prevScale, transform.scale, alpha);
      
      let sX = baseScale;
      let sY = baseScale;
      let sZ = baseScale;

      if (visual) {
          sX *= visual.scale * visual.baseScaleX * visual.dynamicScaleX;
          sY *= visual.scale * visual.baseScaleY * visual.dynamicScaleY;
          sZ *= visual.scale * visual.baseScaleZ * visual.dynamicScaleZ;
      }

      // --- 3. Rotation (Interpolated) ---
      const visRot = visual ? visual.rotation : 0;
      
      // Interpolate physics rotation to avoid snapping
      const physicsRot = lerpAngle(transform.prevRotation, transform.rotation, alpha);

      qSpin.setFromAxisAngle(axisY, visRot);
      qAim.setFromAxisAngle(axisZ, physicsRot - Math.PI/2);
      qFinal.copy(qAim).multiply(qSpin);

      // --- 4. Color ---
      let r = model.r;
      let g = model.g;
      let b = model.b;

      if (effect && effect.flash > 0) {
          const t = effect.flash; 
          r = r + (effect.flashR - r) * t;
          g = g + (effect.flashG - g) * t;
          b = b + (effect.flashB - b) * t;
      }

      // --- 5. Pack Buffer ---
      const buf = group.buffer;
      buf[idx + RenderOffset.POSITION_X] = vx;
      buf[idx + RenderOffset.POSITION_Y] = vy;
      buf[idx + RenderOffset.POSITION_Z] = vz;
      
      buf[idx + RenderOffset.ROTATION_X] = qFinal.x;
      buf[idx + RenderOffset.ROTATION_Y] = qFinal.y;
      buf[idx + RenderOffset.ROTATION_Z] = qFinal.z;
      buf[idx + RenderOffset.ROTATION_W] = qFinal.w;
      
      buf[idx + RenderOffset.SCALE_X] = sX;
      buf[idx + RenderOffset.SCALE_Y] = sY;
      buf[idx + RenderOffset.SCALE_Z] = sZ;
      
      buf[idx + RenderOffset.COLOR_R] = r;
      buf[idx + RenderOffset.COLOR_G] = g;
      buf[idx + RenderOffset.COLOR_B] = b;
      
      buf[idx + RenderOffset.SPAWN_PROGRESS] = effect ? effect.spawnProgress : 1.0;

      group.count++;
    }
  }

  teardown(): void {
    RenderBuffer.reset();
  }
}
