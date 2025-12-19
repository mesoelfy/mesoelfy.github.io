import { useRef, useLayoutEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { RenderBuffer } from '@/engine/graphics/RenderBuffer';
import { RenderOffset, RENDER_STRIDE } from '@/engine/graphics/RenderSchema';
import { GameEvents } from '@/engine/signals/GameEvents';
import { useGameContext } from '@/engine/state/GameContext';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { RenderModel } from '@/engine/ecs/components/RenderModel';

const tempObj = new THREE.Object3D();
const tempColor = new THREE.Color();

interface InstancedActorProps {
  tag: string;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  maxCount: number;
  renderKey?: string; 
  interactive?: boolean; 
  updateEntity?: any; 
  filter?: any;
  baseColor?: string;
  z?: number;
}

export const InstancedActor = ({ 
    geometry, material, maxCount, 
    interactive = false, renderKey 
}: InstancedActorProps) => {
  const { registry, events } = useGameContext();
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
            buffer[offset + RenderOffset.POSITION_X],
            buffer[offset + RenderOffset.POSITION_Y],
            buffer[offset + RenderOffset.POSITION_Z]
        );

        // QUAT
        tempObj.quaternion.set(
            buffer[offset + RenderOffset.ROTATION_X],
            buffer[offset + RenderOffset.ROTATION_Y],
            buffer[offset + RenderOffset.ROTATION_Z],
            buffer[offset + RenderOffset.ROTATION_W]
        );

        // SCALE
        tempObj.scale.set(
            buffer[offset + RenderOffset.SCALE_X],
            buffer[offset + RenderOffset.SCALE_Y],
            buffer[offset + RenderOffset.SCALE_Z]
        );

        tempObj.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObj.matrix);
        
        // COLOR
        tempColor.setRGB(
            buffer[offset + RenderOffset.COLOR_R],
            buffer[offset + RenderOffset.COLOR_G],
            buffer[offset + RenderOffset.COLOR_B]
        );
        if (meshRef.current.instanceColor) meshRef.current.setColorAt(i, tempColor);
        
        // SPAWN
        spawnAttr.setX(i, buffer[offset + RenderOffset.SPAWN_PROGRESS]);
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
          const candidates = Array.from(registry.query({ all: [ComponentType.Transform, ComponentType.RenderModel] }));
          
          let matchIndex = 0;
          let foundEntity = null;
          
          for (const ent of candidates) {
              if (!ent.active) continue;
              const model = ent.getComponent<RenderModel>(ComponentType.RenderModel);
              if (!model) continue;
              
              const key = `${model.geometryId}|${model.materialId}`;
              if (key === renderKey) {
                  if (matchIndex === e.instanceId) {
                      foundEntity = ent;
                      break;
                  }
                  matchIndex++;
              }
          }

          if (foundEntity) {
              events.emit(GameEvents.ENEMY_DAMAGED, { id: foundEntity.id as number, damage: 9999, type: 'TAP' });
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
