import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { RenderData } from '@/engine/ecs/components/RenderData';
import { Entity } from '@/engine/ecs/Entity';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { applyRotation } from '@/engine/math/RenderUtils';

const tempObj = new THREE.Object3D();
const tempColor = new THREE.Color();
const SPAWN_Y_OFFSET = 3.5;

interface InstancedActorProps {
  tag: string;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  maxCount: number;
  updateEntity?: (entity: Entity, obj: THREE.Object3D, color: THREE.Color, delta: number) => void;
  filter?: (entity: Entity) => boolean;
  baseColor?: string;
  interactive?: boolean; 
  z?: number;
}

export const InstancedActor = ({ tag, geometry, material, maxCount, updateEntity, filter, baseColor = '#FFFFFF', interactive = false, z = 0 }: InstancedActorProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const instanceMap = useMemo(() => new Int32Array(maxCount).fill(-1), [maxCount]);
  const defaultColor = useMemo(() => new THREE.Color(baseColor), [baseColor]);

  useLayoutEffect(() => {
    if (meshRef.current) {
        meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(maxCount * 3), 3);
        
        meshRef.current.geometry.setAttribute(
            'spawnProgress', 
            new THREE.InstancedBufferAttribute(new Float32Array(maxCount), 1)
        );
    }
  }, [maxCount]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    let registry;
    try { registry = ServiceLocator.getRegistry(); } catch { return; }

    const entities = registry.getByTag(tag);
    let count = 0;
    
    const spawnAttr = meshRef.current.geometry.getAttribute('spawnProgress') as THREE.InstancedBufferAttribute;

    for (const entity of entities) {
      if (count >= maxCount) break;
      if (filter && !filter(entity)) continue;

      const transform = entity.getComponent<TransformData>(ComponentType.Transform);
      if (!transform) continue;
      
      if (interactive) instanceMap[count] = entity.id as number;

      // Direct property access (Simpler than previous TransformStore lookup)
      const { x, y, rotation, scale } = transform;

      tempObj.position.set(x, y, z);
      
      const render = entity.getComponent<RenderData>(ComponentType.Render);
      let finalScale = scale;
      let visualRot = 0;
      let spawnVal = 1.0;

      if (render) {
          finalScale *= render.visualScale;
          visualRot = render.visualRotation;
          tempColor.setRGB(render.r, render.g, render.b);
          spawnVal = render.spawnProgress;

          // --- VISUAL OFFSET LOGIC ---
          if (spawnVal < 1.0) {
              const t = spawnVal;
              const ease = 1 - Math.pow(1 - t, 3); 
              const yOffset = -SPAWN_Y_OFFSET * (1.0 - ease);
              tempObj.position.y += yOffset;
          }

          // --- SHUDDER LOGIC ---
          if (render.shudder > 0) {
              const shake = render.shudder * 0.2; 
              tempObj.position.x += (Math.random() - 0.5) * shake;
              tempObj.position.y += (Math.random() - 0.5) * shake;
          }
      } else {
          tempColor.copy(defaultColor);
      }

      applyRotation(tempObj, visualRot, rotation);
      tempObj.scale.setScalar(finalScale);

      if (updateEntity) updateEntity(entity, tempObj, tempColor, delta);

      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(count, tempObj.matrix);
      if (meshRef.current.instanceColor) meshRef.current.setColorAt(count, tempColor);
      
      spawnAttr.setX(count, spawnVal);
      
      count++;
    }

    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    spawnAttr.needsUpdate = true;
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
      if (!interactive || e.instanceId === undefined) return;
      e.stopPropagation();
      const entityId = instanceMap[e.instanceId];
      if (entityId !== -1) GameEventBus.emit(GameEvents.ENEMY_DAMAGED, { id: entityId, damage: 9999, type: 'TAP' });
  };

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, material, maxCount]} 
      frustumCulled={false}
      onPointerDown={interactive ? handlePointerDown : undefined}
    />
  );
};
