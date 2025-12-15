import { useMemo } from 'react';
import * as THREE from 'three';
import { Tag } from '@/engine/ecs/types';
import { EnemyTypes } from '@/sys/config/Identifiers';
import { InstancedActor } from './InstancedActor';
import { IdentityData } from '@/sys/data/IdentityData';
import { AIStateData } from '@/sys/data/AIStateData';
import { ComponentType } from '@/engine/ecs/ComponentType';

export const DaemonActor = () => {
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
          
          if (state && typeof state.data.springVal === 'number') {
              // Apply the physics-based squash/stretch
              const val = state.data.springVal;
              const sy = 1.0 + val;
              const sx = 1.0 - (val * 0.5);
              
              // Apply local scale deformation
              obj.scale.set(sx, sy, sx);
              
              // Flash on high recoil (when velocity is high)
              if (Math.abs(state.data.springVel) > 10.0) {
                  color.set('#FFFFFF');
              } else {
                  color.set('#00F0FF');
              }
          }
      }}
    />
  );
};
