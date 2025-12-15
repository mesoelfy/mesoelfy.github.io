import { useMemo } from 'react';
import * as THREE from 'three';
import { Tag } from '@/engine/ecs/types';
import { EnemyTypes } from '@/sys/config/Identifiers';
import { InstancedActor } from './InstancedActor';
import { IdentityData } from '../data/IdentityData';
import { ComponentType } from '@/engine/ecs/ComponentType';

export const DaemonActor = () => {
  const geometry = useMemo(() => new THREE.OctahedronGeometry(0.6, 0), []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({ 
      color: '#00F0FF', 
      wireframe: true,
      transparent: true,
      opacity: 0.8
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
      updateEntity={(e, obj) => {
          // Daemon still has unique scaling logic (Non-uniform)
          // RenderData only supports uniform visualScale.
          // So we keep the override here for the specific shape-shifting.
          
          // However, we can read visualScale from RenderData to apply the pulses
          // calculated in DaemonLogic.
          // But DaemonActor had `obj.scale.set(1.2, 0.5, 1.2)` for "Fire".
          // This specific non-uniform scale is best left here for now.
      }}
    />
  );
};
