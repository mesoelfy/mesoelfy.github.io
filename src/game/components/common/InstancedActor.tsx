import { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ActiveEngine } from '../GameDirector';
import { TransformComponent } from '../data/TransformComponent';
import { IdentityComponent } from '../data/IdentityComponent';
import { Entity } from '@/game/core/ecs/Entity';
import { TransformStore } from '@/game/core/ecs/TransformStore';

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
}

export const InstancedActor = ({ 
  tag, 
  geometry, 
  material, 
  maxCount, 
  updateEntity, 
  filter, 
  baseColor = '#FFFFFF',
  colorSource = 'identity' 
}: InstancedActorProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (meshRef.current) {
        meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(maxCount * 3), 3);
    }
  }, [maxCount]);

  useFrame((state, delta) => {
    if (!meshRef.current || !ActiveEngine) return;

    // Use cached query from ActiveEngine if possible, or tag lookup
    const entities = ActiveEngine.registry.getByTag(tag);
    let count = 0;
    
    // Direct Array Access for Speed
    const transformData = TransformStore.data;

    for (const entity of entities) {
      if (count >= maxCount) break;
      if (filter && !filter(entity)) continue;

      const transform = entity.getComponent<TransformComponent>('Transform');
      if (!transform) continue;

      // OPTIMIZED READ: Direct buffer access using component index
      const idx = transform.index * STRIDE;
      const x = transformData[idx];
      const y = transformData[idx + 1];
      const rot = transformData[idx + 2];
      const scale = transformData[idx + 3];

      // 1. Base Transform
      tempObj.position.set(x, y, 0);
      tempObj.rotation.set(0, 0, rot);
      tempObj.scale.set(scale, scale, 1);

      // 2. Color Logic
      if (colorSource === 'identity') {
          const identity = entity.getComponent<IdentityComponent>('Identity');
          if (identity) tempColor.set(identity.variant); 
          else tempColor.set(baseColor);
      } else {
          tempColor.set(baseColor); 
      }

      // 3. Custom Logic (updateEntity might modify tempObj further)
      if (updateEntity) {
        updateEntity(entity, tempObj, tempColor, delta);
      }

      // 4. Apply
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

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, material, maxCount]} 
      frustumCulled={false}
    />
  );
};
