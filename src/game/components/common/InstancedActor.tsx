import { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ActiveEngine } from '../GameDirector';
import { TransformComponent } from '../data/TransformComponent';
import { IdentityComponent } from '../data/IdentityComponent';
import { Entity } from '@/game/core/ecs/Entity';

const tempObj = new THREE.Object3D();
const tempColor = new THREE.Color();

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

  // FIX: Initialize the color buffer!
  useLayoutEffect(() => {
    if (meshRef.current) {
        meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(maxCount * 3), 3);
    }
  }, [maxCount]);

  useFrame((state, delta) => {
    if (!meshRef.current || !ActiveEngine) return;

    const entities = ActiveEngine.registry.getByTag(tag);
    let count = 0;

    for (const entity of entities) {
      if (count >= maxCount) break;
      if (filter && !filter(entity)) continue;

      const transform = entity.getComponent<TransformComponent>('Transform');
      if (!transform) continue;

      // 1. Base Transform
      tempObj.position.set(transform.x, transform.y, 0);
      tempObj.rotation.set(0, 0, transform.rotation);
      tempObj.scale.set(transform.scale, transform.scale, 1);

      // 2. Color Logic
      const identity = entity.getComponent<IdentityComponent>('Identity');
      
      if (colorSource === 'identity' && identity) {
          tempColor.set(identity.variant); 
      } else {
          tempColor.set(baseColor); 
      }

      // 3. Custom Logic
      if (updateEntity) {
        updateEntity(entity, tempObj, tempColor, delta);
      }

      // 4. Apply
      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(count, tempObj.matrix);
      
      // Safe to set color now because we initialized it in useLayoutEffect
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
