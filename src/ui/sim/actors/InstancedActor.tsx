import { useRef, useLayoutEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { RenderBuffer, RENDER_STRIDE } from '@/engine/graphics/RenderBuffer';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { RenderData } from '@/engine/ecs/components/RenderData';

const tempObj = new THREE.Object3D();
const tempColor = new THREE.Color();

interface InstancedActorProps {
  tag: string;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  maxCount: number;
  renderKey?: string; 
  interactive?: boolean; 
  // Unused but kept for interface compatibility
  updateEntity?: any; 
  filter?: any;
  baseColor?: string;
  z?: number;
}

export const InstancedActor = ({ 
    geometry, material, maxCount, 
    interactive = false, renderKey 
}: InstancedActorProps) => {
  
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  useLayoutEffect(() => {
    if (meshRef.current) {
        meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(maxCount * 3), 3);
        meshRef.current.geometry.setAttribute(
            'spawnProgress', 
            new THREE.InstancedBufferAttribute(new Float32Array(maxCount), 1)
        );
    }
  }, [maxCount]);

  useFrame(() => {
    if (!meshRef.current || !renderKey) return;

    const group = RenderBuffer.getGroup(renderKey);
    const count = group.count;
    const buffer = group.buffer;

    if (count === 0) {
        meshRef.current.count = 0;
        return;
    }

    const spawnAttr = meshRef.current.geometry.getAttribute('spawnProgress') as THREE.InstancedBufferAttribute;

    for (let i = 0; i < count; i++) {
        const offset = i * RENDER_STRIDE;
        
        // POS
        tempObj.position.set(
            buffer[offset + 0],
            buffer[offset + 1],
            buffer[offset + 2]
        );

        // QUAT
        tempObj.quaternion.set(
            buffer[offset + 3],
            buffer[offset + 4],
            buffer[offset + 5],
            buffer[offset + 6]
        );

        // SCALE
        tempObj.scale.set(
            buffer[offset + 7],
            buffer[offset + 8],
            buffer[offset + 9]
        );

        tempObj.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObj.matrix);
        
        // COLOR
        tempColor.setRGB(
            buffer[offset + 10],
            buffer[offset + 11],
            buffer[offset + 12]
        );
        if (meshRef.current.instanceColor) meshRef.current.setColorAt(i, tempColor);
        
        // SPAWN
        spawnAttr.setX(i, buffer[offset + 13]);
    }

    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    spawnAttr.needsUpdate = true;
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
      if (!interactive || e.instanceId === undefined) return;
      e.stopPropagation();
      
      try {
          const registry = ServiceLocator.getRegistry();
          const candidates = Array.from(registry.query({ all: [ComponentType.Transform, ComponentType.Render] }));
          
          let matchIndex = 0;
          let foundEntity = null;
          
          for (const ent of candidates) {
              if (!ent.active) continue;
              const render = ent.getComponent<RenderData>(ComponentType.Render);
              if (!render) continue;
              
              const key = `${render.geometryId}|${render.materialId}`;
              if (key === renderKey) {
                  if (matchIndex === e.instanceId) {
                      foundEntity = ent;
                      break;
                  }
                  matchIndex++;
              }
          }

          if (foundEntity) {
              GameEventBus.emit(GameEvents.ENEMY_DAMAGED, { id: foundEntity.id as number, damage: 9999, type: 'TAP' });
          }
      } catch (err) {
          console.warn("Interaction Failed:", err);
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
