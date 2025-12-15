import { useMemo } from 'react';
import * as THREE from 'three';
import { Tag } from '@/engine/ecs/types';
import { EnemyTypes } from '@/sys/config/Identifiers';
import { InstancedActor } from './InstancedActor';
import { IdentityData } from '@/sys/data/IdentityData';
import { AIStateData } from '@/sys/data/AIStateData';
import { ComponentType } from '@/engine/ecs/ComponentType';

export const DaemonActor = () => {
  // Cage Geometry (Octahedron)
  const geometry = useMemo(() => new THREE.OctahedronGeometry(0.7, 0), []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({ 
      color: '#00F0FF', 
      wireframe: true,
      transparent: true,
      opacity: 0.6
  }), []);
  
  const baseColor = '#00F0FF';

  return (
    <InstancedActor 
      tag={Tag.PLAYER} 
      geometry={geometry} 
      material={material} 
      maxCount={5}
      baseColor={baseColor}
      filter={(e) => e.getComponent<IdentityData>(ComponentType.Identity)?.variant === EnemyTypes.DAEMON}
      updateEntity={(e, obj, color) => {
          const state = e.getComponent<AIStateData>(ComponentType.State);
          
          if (state && state.current === 'FIRE') {
              // SPRING SQUISH: Flatten on Y, Bulge on X/Z
              // We use a sine wave based on time or simple recoil?
              // Logic is fast, so let's just hard squash it.
              obj.scale.set(1.5, 0.4, 1.5);
              
              // Flash White
              color.set('#FFFFFF');
          } else {
              // Reset Scale handled by InstancedActor base logic (uniform),
              // but we need to ensure we don't leave it squashed.
              // InstancedActor applies `tempObj.scale.setScalar(finalScale)` BEFORE this callback.
              // So we are just multiplying/overriding here.
              
              // Gentle breathing in IDLE/READY
              if (state && state.current === 'READY') {
                  const s = 1.0 + Math.sin(Date.now() * 0.005) * 0.05;
                  obj.scale.multiplyScalar(s);
              }
          }
      }}
    />
  );
};
