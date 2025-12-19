import { IGameSystem, IEntityRegistry } from '@/engine/interfaces';
import { RenderBuffer, RENDER_STRIDE } from '@/engine/graphics/RenderBuffer';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { RenderData } from '@/engine/ecs/components/RenderData';
import { MotionData } from '@/engine/ecs/components/MotionData';
import * as THREE from 'three';

// TUNED CONSTANTS (Subtle Rigid Body Motion)
const STRETCH_FACTOR = 0.005; // Extremely subtle elongation
const SQUASH_FACTOR = 0.002;  // Minimal thinning
const MAX_STRETCH = 1.1;      // Cap at 10% max stretch
const MIN_SQUASH = 0.95;      // Cap at 5% max squash
const SPAWN_Y_OFFSET = 3.5;

// Reusable Math Objects (Zero-Alloc)
const axisY = new THREE.Vector3(0, 1, 0); 
const axisZ = new THREE.Vector3(0, 0, 1); 
const qSpin = new THREE.Quaternion();
const qAim = new THREE.Quaternion();
const qFinal = new THREE.Quaternion();

export class VisualSystem implements IGameSystem {
  constructor(private registry: IEntityRegistry) {}

  update(delta: number, time: number): void {
    RenderBuffer.reset();

    const entities = this.registry.query({ all: [ComponentType.Transform, ComponentType.Render] });

    for (const entity of entities) {
      if (!entity.active) continue;

      const transform = entity.getComponent<TransformData>(ComponentType.Transform);
      const render = entity.getComponent<RenderData>(ComponentType.Render);
      const motion = entity.getComponent<MotionData>(ComponentType.Motion);

      if (!transform || !render) continue;

      const key = `${render.geometryId}|${render.materialId}`;
      const group = RenderBuffer.getGroup(key);
      const idx = group.count * RENDER_STRIDE;
      
      RenderBuffer.ensureCapacity(group, idx + RENDER_STRIDE);

      // --- 1. Position ---
      let vx = transform.x;
      let vy = transform.y;
      let vz = 0;
      
      // Spawn Drop
      if (render.spawnProgress < 1.0) {
          const t = render.spawnProgress;
          const ease = 1 - Math.pow(1 - t, 3); 
          const yOffset = -SPAWN_Y_OFFSET * (1.0 - ease);
          vy += yOffset;
      }

      // Shudder
      if (render.shudder > 0) {
          const shake = render.shudder * 0.2; 
          vx += (Math.random() - 0.5) * shake;
          vy += (Math.random() - 0.5) * shake;
      }

      // --- 2. Scale (Squash/Stretch) ---
      let scaleX = transform.scale * render.visualScale;
      let scaleY = transform.scale * render.visualScale;
      let scaleZ = transform.scale * render.visualScale;
      
      if (motion) {
          const speedSq = motion.vx * motion.vx + motion.vy * motion.vy;
          // Threshold raised slightly so slow movements don't trigger it at all
          if (speedSq > 4.0) { 
              const speed = Math.sqrt(speedSq);
              const stretchY = Math.min(MAX_STRETCH, 1.0 + (speed * STRETCH_FACTOR));
              const squashXZ = Math.max(MIN_SQUASH, 1.0 - (speed * SQUASH_FACTOR));
              
              scaleY *= stretchY;
              scaleX *= squashXZ;
              scaleZ *= squashXZ;
          }
      }

      // --- 3. Rotation (Quaternion Composition) ---
      // A. Spin around Local Y (Model Axis)
      qSpin.setFromAxisAngle(axisY, render.visualRotation);
      
      // B. Aim around World Z
      // Offset by -PI/2 because model default is Y-Up, but 0 radians is Right (X-axis)
      qAim.setFromAxisAngle(axisZ, transform.rotation - Math.PI/2);
      
      // C. Combine: Apply spin first (local), then aim (world)
      qFinal.copy(qAim).multiply(qSpin);

      // --- 4. Pack ---
      // POS
      group.buffer[idx + 0] = vx;
      group.buffer[idx + 1] = vy;
      group.buffer[idx + 2] = vz;
      
      // QUAT
      group.buffer[idx + 3] = qFinal.x;
      group.buffer[idx + 4] = qFinal.y;
      group.buffer[idx + 5] = qFinal.z;
      group.buffer[idx + 6] = qFinal.w;
      
      // SCALE
      group.buffer[idx + 7] = scaleX;
      group.buffer[idx + 8] = scaleY;
      group.buffer[idx + 9] = scaleZ;
      
      // COLOR
      group.buffer[idx + 10] = render.r;
      group.buffer[idx + 11] = render.g;
      group.buffer[idx + 12] = render.b;
      
      // OTHER
      group.buffer[idx + 13] = render.spawnProgress;

      group.count++;
    }
  }

  teardown(): void {
    RenderBuffer.reset();
  }
}
