import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ServiceLocator } from '@/sys/services/ServiceLocator';
import { Tag } from '@/engine/ecs/types';
import { TransformData } from '@/sys/data/TransformData';
import { MotionData } from '@/sys/data/MotionData';
import { RenderData } from '@/sys/data/RenderData';
import { IdentityData } from '@/sys/data/IdentityData';
import { AssetService } from '@/ui/sim/assets/AssetService';
import { GAME_THEME } from '@/ui/sim/config/theme';
import { ComponentType } from '@/engine/ecs/ComponentType';

const tempObj = new THREE.Object3D();
const tempColor = new THREE.Color();
const MAX_BULLETS = 1000;

// Base colors fallback
const COL_PLAYER = new THREE.Color(GAME_THEME.bullet.plasma);
const COL_ENEMY = new THREE.Color(GAME_THEME.bullet.hunter);

export const BallisticsRenderer = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const geometry = useMemo(() => AssetService.get<THREE.BufferGeometry>('GEO_BALLISTIC'), []);
  const material = useMemo(() => AssetService.get<THREE.Material>('MAT_BALLISTIC'), []);

  useLayoutEffect(() => {
    if (meshRef.current) {
        meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_BULLETS * 3), 3);
    }
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Update Shader Uniforms
    if (material instanceof THREE.ShaderMaterial) {
        material.uniforms.uTime.value = state.clock.elapsedTime;
    }

    let registry;
    try { registry = ServiceLocator.getRegistry(); } catch { return; }

    const bullets = registry.getByTag(Tag.BULLET);
    let count = 0;

    for (const entity of bullets) {
      if (!entity.active || count >= MAX_BULLETS) continue;

      const transform = entity.getComponent<TransformData>(ComponentType.Transform);
      const motion = entity.getComponent<MotionData>(ComponentType.Motion);
      const render = entity.getComponent<RenderData>(ComponentType.Render);
      
      if (!transform || !motion) continue;

      // 1. Calculate Stretch based on Speed
      // Speed = magnitude of velocity vector
      const speed = Math.sqrt(motion.vx * motion.vx + motion.vy * motion.vy);
      
      // Base scale: 1.0. 
      // Stretch factor: +0.05 per unit of speed.
      // Example: Speed 20 -> 1.0 + 1.0 = 2.0 scale Y
      const stretch = 1.0 + (speed * 0.05);
      
      // Squash width slightly to conserve volume feel
      const squash = 1.0 / Math.sqrt(stretch); 

      // 2. Visual Rotation
      // Bullets should always face their velocity vector
      // Offset by -PI/2 because our capsule is vertical in UV space (0,1)
      const angle = Math.atan2(motion.vy, motion.vx) - (Math.PI / 2);

      // 3. Apply Transform
      tempObj.position.set(transform.x, transform.y, 0);
      tempObj.rotation.set(0, 0, angle);
      
      const baseScale = transform.scale; // From EntitySpawner (widthMult)
      
      // Combine base scale (size) with squash/stretch (physics)
      tempObj.scale.set(baseScale * squash, baseScale * stretch, 1.0);
      
      // 4. Color Logic
      if (render) {
          tempColor.setRGB(render.r, render.g, render.b);
      } else {
          // Fallback based on Tag
          if (entity.hasTag(Tag.ENEMY)) tempColor.copy(COL_ENEMY);
          else tempColor.copy(COL_PLAYER);
      }

      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(count, tempObj.matrix);
      meshRef.current.setColorAt(count, tempColor);
      
      count++;
    }

    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, material, MAX_BULLETS]} 
      frustumCulled={false}
      renderOrder={1} // Render after floor/trails
    />
  );
};
