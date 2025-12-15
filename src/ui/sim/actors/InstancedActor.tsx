import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { ServiceLocator } from '@/sys/services/ServiceLocator'; // Use Locator
import { TransformData } from '@/sys/data/TransformData';
import { IdentityData } from '@/sys/data/IdentityData';
import { Entity } from '@/engine/ecs/Entity';
import { TransformStore } from '@/engine/ecs/TransformStore';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { ComponentType } from '@/engine/ecs/ComponentType';

const tempObj = new THREE.Object3D();
const tempColor = new THREE.Color();
const STRIDE = 4;

interface InstancedActorProps {
  tag: string;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  maxCount: number;
  updateEntity?: (entity: Entity, obj: THREE.Object3D, color: THREE.Color, delta: number) => void;
  filter?: (entity: Entity) => boolean;
  baseColor?: string;
  colorSource?: 'identity' | 'base'; 
  interactive?: boolean; 
}

export const InstancedActor = ({ 
  tag, 
  geometry, 
  material, 
  maxCount, 
  updateEntity, 
  filter, 
  baseColor = '#FFFFFF',
  colorSource = 'identity',
  interactive = false
}: InstancedActorProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const instanceMap = useMemo(() => new Int32Array(maxCount).fill(-1), [maxCount]);

  useLayoutEffect(() => {
    if (meshRef.current) {
        meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(maxCount * 3), 3);
    }
  }, [maxCount]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // SAFE ACCESS: Get registry from Locator
    // If Engine isn't running/booted, this might throw or return null depending on your implementation.
    // We try/catch or just safe check.
    let registry;
    try {
        registry = ServiceLocator.getRegistry();
    } catch {
        // Registry not ready yet (or game ended)
        return;
    }

    const entities = registry.getByTag(tag);
    let count = 0;
    const transformData = TransformStore.data;

    for (const entity of entities) {
      if (count >= maxCount) break;
      if (filter && !filter(entity)) continue;

      const transform = entity.getComponent<TransformData>(ComponentType.Transform);
      if (!transform) continue;

      if (interactive) {
          instanceMap[count] = entity.id as number;
      }

      const idx = transform.index * STRIDE;
      const x = transformData[idx];
      const y = transformData[idx + 1];
      const rot = transformData[idx + 2];
      const scale = transformData[idx + 3];

      tempObj.position.set(x, y, 0);
      tempObj.rotation.set(0, 0, rot);
      tempObj.scale.set(scale, scale, 1);

      if (colorSource === 'identity') {
          const identity = entity.getComponent<IdentityData>(ComponentType.Identity);
          if (identity) tempColor.set(identity.variant); 
          else tempColor.set(baseColor);
      } else {
          tempColor.set(baseColor); 
      }

      if (updateEntity) {
        updateEntity(entity, tempObj, tempColor, delta);
      }

      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(count, tempObj.matrix);
      
      if (meshRef.current.instanceColor) {
        meshRef.current.setColorAt(count, tempColor);
      }
      
      count++;
    }

    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
      if (!interactive || e.instanceId === undefined) return;
      e.stopPropagation();
      
      const entityId = instanceMap[e.instanceId];
      if (entityId !== -1) {
          GameEventBus.emit(GameEvents.ENEMY_DAMAGED, { 
              id: entityId, 
              damage: 9999, 
              type: 'TAP' 
          });
      }
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
