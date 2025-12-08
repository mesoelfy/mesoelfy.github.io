import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Tag } from '../core/ecs/types';
import { EnemyTypes } from '../config/Identifiers';
import { InstancedActor } from './common/InstancedActor';
import { IdentityComponent } from '../data/IdentityComponent';
import { StateComponent } from '../data/StateComponent';

export const DaemonRenderer = () => {
  const geometry = useMemo(() => new THREE.OctahedronGeometry(0.6, 0), []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({ 
      color: '#00F0FF', 
      wireframe: true,
      transparent: true,
      opacity: 0.8
  }), []);

  return (
    <InstancedActor 
      tag={Tag.PLAYER} 
      geometry={geometry} 
      material={material} 
      maxCount={5}
      filter={(e) => e.getComponent<IdentityComponent>('Identity')?.variant === EnemyTypes.DAEMON}
      updateEntity={(e, obj, color, delta) => {
          const state = e.getComponent<StateComponent>('State');
          
          if (state) {
              if (state.current === 'FIRE' || state.current === 'COOLDOWN') {
                  // SQUISH & REVERSE SPIN
                  obj.scale.set(1.2, 0.5, 1.2); // Squish
                  obj.rotation.y -= delta * 15.0; // Reverse fast
              } else {
                  // EASE BACK TO NORMAL
                  // We lerp scale back to 1.0 for smoothness if needed, 
                  // but for 'CHARGING' it's fast spin anyway.
                  obj.scale.setScalar(1.0);
                  
                  if (state.current === 'CHARGING') {
                      obj.rotation.y += delta * 10.0;
                  } else {
                      obj.rotation.y += delta * 1.0;
                  }
              }
          }
      }}
    />
  );
};
