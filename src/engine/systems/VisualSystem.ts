import { IGameSystem, IEntityRegistry } from '@/engine/interfaces';
import { RenderBuffer } from '@/engine/graphics/RenderBuffer';
import { RenderOffset, RENDER_STRIDE } from '@/engine/graphics/RenderSchema';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { RenderModel } from '@/engine/ecs/components/RenderModel';
import { RenderTransform } from '@/engine/ecs/components/RenderTransform';
import { RenderEffect } from '@/engine/ecs/components/RenderEffect';
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

    // Query: Must have Position + Visual Model
    const entities = this.registry.query({ all: [ComponentType.Transform, ComponentType.RenderModel] });

    for (const entity of entities) {
      if (!entity.active) continue;

      const transform = entity.getComponent<TransformData>(ComponentType.Transform);
      const model = entity.getComponent<RenderModel>(ComponentType.RenderModel);
      
      // Optional Components
      const visual = entity.getComponent<RenderTransform>(ComponentType.RenderTransform);
      const effect = entity.getComponent<RenderEffect>(ComponentType.RenderEffect);
      const motion = entity.getComponent<MotionData>(ComponentType.Motion);

      if (!transform || !model) continue;

      const key = `${model.geometryId}|${model.materialId}`;
      const group = RenderBuffer.getGroup(key);
      const idx = group.count * RENDER_STRIDE;
      
      RenderBuffer.ensureCapacity(group, idx + RENDER_STRIDE);

      // --- 1. Position ---
      let vx = transform.x;
      let vy = transform.y;
      const vz = visual ? visual.offsetZ : 0;
      
      let spawnP = 1.0;
      if (effect) {
          spawnP = effect.spawnProgress;
          if (spawnP < 1.0) {
              const t = spawnP;
              const ease = 1 - Math.pow(1 - t, 3); 
              const yOffset = -SPAWN_Y_OFFSET * (1.0 - ease);
              vy += yOffset;
          }
          if (effect.shudder > 0) {
              const shake = effect.shudder * 0.2; 
              vx += (Math.random() - 0.5) * shake;
              vy += (Math.random() - 0.5) * shake;
          }
      }

      if (visual) {
          vx += visual.offsetX;
          vy += visual.offsetY;
      }

      // --- 2. Scale ---
      let sX = transform.scale;
      let sY = transform.scale;
      let sZ = transform.scale;

      if (visual) {
          sX *= visual.scale * visual.baseScaleX;
          sY *= visual.scale * visual.baseScaleY;
          sZ *= visual.scale * visual.baseScaleZ;
      }
      
      // Velocity Deformation
      if (effect && motion && effect.elasticity > 0.01) {
          const speedSq = motion.vx * motion.vx + motion.vy * motion.vy;
          const threshold = effect.elasticity > 1.0 ? 1.0 : 4.0;

          if (speedSq > threshold) {
              const speed = Math.sqrt(speedSq);
              let stretchY, squashXZ;
              
              if (effect.elasticity > 1.0) {
                  stretchY = Math.min(MAX_STRETCH_CAP, 1.0 + (speed * BASE_STRETCH * effect.elasticity));
                  squashXZ = Math.max(MIN_SQUASH_CAP, 1.0 - (speed * BASE_SQUASH * effect.elasticity));
              } else {
                  stretchY = Math.min(MAX_STRETCH, 1.0 + (speed * STRETCH_FACTOR));
                  squashXZ = Math.max(MIN_SQUASH, 1.0 - (speed * SQUASH_FACTOR));
              }
              
              sY *= stretchY;
              sX *= squashXZ;
              sZ *= squashXZ;
          }
      }

      // --- 3. Rotation ---
      const visRot = visual ? visual.rotation : 0;
      qSpin.setFromAxisAngle(axisY, visRot);
      qAim.setFromAxisAngle(axisZ, transform.rotation - Math.PI/2);
      qFinal.copy(qAim).multiply(qSpin);

      // --- 4. Color ---
      let r = model.r;
      let g = model.g;
      let b = model.b;

      if (effect && effect.flash > 0) {
          // Mix with Flash Color
          const t = effect.flash; // 0..1
          
          // Flash Color defaults to White/Pinkish if not set? 
          // Effect component has flashR/G/B now.
          r = r + (effect.flashR - r) * t;
          g = g + (effect.flashG - g) * t;
          b = b + (effect.flashB - b) * t;
      }

      // --- 5. Pack ---
      group.buffer[idx + RenderOffset.POSITION_X] = vx;
      group.buffer[idx + RenderOffset.POSITION_Y] = vy;
      group.buffer[idx + RenderOffset.POSITION_Z] = vz;
      
      group.buffer[idx + RenderOffset.ROTATION_X] = qFinal.x;
      group.buffer[idx + RenderOffset.ROTATION_Y] = qFinal.y;
      group.buffer[idx + RenderOffset.ROTATION_Z] = qFinal.z;
      group.buffer[idx + RenderOffset.ROTATION_W] = qFinal.w;
      
      group.buffer[idx + RenderOffset.SCALE_X] = sX;
      group.buffer[idx + RenderOffset.SCALE_Y] = sY;
      group.buffer[idx + RenderOffset.SCALE_Z] = sZ;
      
      group.buffer[idx + RenderOffset.COLOR_R] = r;
      group.buffer[idx + RenderOffset.COLOR_G] = g;
      group.buffer[idx + RenderOffset.COLOR_B] = b;
      
      group.buffer[idx + RenderOffset.SPAWN_PROGRESS] = spawnP;

      group.count++;
    }
  }

  teardown(): void {
    RenderBuffer.reset();
  }
}
