import { IGameSystem, IEntityRegistry } from '@/engine/interfaces';
import { RenderBuffer, RENDER_STRIDE } from '@/engine/graphics/RenderBuffer';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { RenderData } from '@/engine/ecs/components/RenderData';
import { MotionData } from '@/engine/ecs/components/MotionData';
import * as THREE from 'three';

const STRETCH_FACTOR = 0.005; 
const SQUASH_FACTOR = 0.002;  
const MAX_STRETCH = 1.1;      
const MIN_SQUASH = 0.95;      
const SPAWN_Y_OFFSET = 3.5;

// BASE FACTORS (Multiplied by Elasticity)
const BASE_STRETCH = 0.04; 
const BASE_SQUASH = 0.02;
const MAX_STRETCH_CAP = 4.0;
const MIN_SQUASH_CAP = 0.4;

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
      
      if (render.spawnProgress < 1.0) {
          const t = render.spawnProgress;
          const ease = 1 - Math.pow(1 - t, 3); 
          const yOffset = -SPAWN_Y_OFFSET * (1.0 - ease);
          vy += yOffset;
      }

      if (render.shudder > 0) {
          const shake = render.shudder * 0.2; 
          vx += (Math.random() - 0.5) * shake;
          vy += (Math.random() - 0.5) * shake;
      }

      // --- 2. Scale ---
      // Apply base dimensions first (Aspect Ratio)
      // Transform.scale is the uniform multiplier
      // Render.visualScale is the effect multiplier (pulsing)
      let scaleX = transform.scale * render.visualScale * render.baseScaleX;
      let scaleY = transform.scale * render.visualScale * render.baseScaleY;
      let scaleZ = transform.scale * render.visualScale * render.baseScaleZ;
      
      // Velocity Deformation (Squash/Stretch)
      if (motion && render.elasticity > 0.01) {
          const speedSq = motion.vx * motion.vx + motion.vy * motion.vy;
          const threshold = render.elasticity > 1.0 ? 1.0 : 4.0; // Bullets stretch easier than enemies

          if (speedSq > threshold) {
              const speed = Math.sqrt(speedSq);
              
              // Apply Elasticity to the base factors
              // If elasticity is high (bullets), use the "jelly" caps.
              // If low (enemies), use the "rigid" caps.
              
              let stretchY, squashXZ;
              
              if (render.elasticity > 1.0) {
                  // Bullet Logic
                  stretchY = Math.min(MAX_STRETCH_CAP, 1.0 + (speed * BASE_STRETCH * render.elasticity));
                  squashXZ = Math.max(MIN_SQUASH_CAP, 1.0 - (speed * BASE_SQUASH * render.elasticity));
              } else {
                  // Rigid Logic
                  stretchY = Math.min(MAX_STRETCH, 1.0 + (speed * STRETCH_FACTOR));
                  squashXZ = Math.max(MIN_SQUASH, 1.0 - (speed * SQUASH_FACTOR));
              }
              
              scaleY *= stretchY;
              scaleX *= squashXZ;
              scaleZ *= squashXZ;
          }
      }

      // --- 3. Rotation ---
      qSpin.setFromAxisAngle(axisY, render.visualRotation);
      qAim.setFromAxisAngle(axisZ, transform.rotation - Math.PI/2);
      qFinal.copy(qAim).multiply(qSpin);

      // --- 4. Pack ---
      group.buffer[idx + 0] = vx;
      group.buffer[idx + 1] = vy;
      group.buffer[idx + 2] = vz;
      group.buffer[idx + 3] = qFinal.x;
      group.buffer[idx + 4] = qFinal.y;
      group.buffer[idx + 5] = qFinal.z;
      group.buffer[idx + 6] = qFinal.w;
      group.buffer[idx + 7] = scaleX;
      group.buffer[idx + 8] = scaleY;
      group.buffer[idx + 9] = scaleZ;
      group.buffer[idx + 10] = render.r;
      group.buffer[idx + 11] = render.g;
      group.buffer[idx + 12] = render.b;
      group.buffer[idx + 13] = render.spawnProgress;

      group.count++;
    }
  }

  teardown(): void {
    RenderBuffer.reset();
  }
}
