import { useMemo } from 'react';
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
              // --- 1. HANDLE SPIN LOGIC ---
              // Initialize persistent visual spin if missing
              if (typeof state.data.visualSpin !== 'number') {
                  state.data.visualSpin = 0;
              }

              let targetSpeed = 1.0;

              if (state.current === 'CHARGING') {
                  targetSpeed = 15.0; // Fast spin building up
              } 
              else if (state.current === 'READY') {
                  targetSpeed = 3.0; // Slower, menacing hum (Requested Polish)
              }
              else if (state.current === 'FIRE') {
                  targetSpeed = 20.0; // Violent snap
              }
              else if (state.current === 'COOLDOWN') {
                  targetSpeed = -5.0; // Reverse recoil spin
              }

              // Smoothly interpolate current speed (simulating inertia)
              // We store 'currentSpeed' to prevent instant velocity changes
              if (typeof state.data.currentSpinSpeed !== 'number') state.data.currentSpinSpeed = 1.0;
              
              state.data.currentSpinSpeed = THREE.MathUtils.lerp(state.data.currentSpinSpeed, targetSpeed, delta * 5.0);
              state.data.visualSpin += state.data.currentSpinSpeed * delta;
              
              obj.rotation.y = state.data.visualSpin;


              // --- 2. HANDLE SCALE LOGIC ---
              if (state.current === 'FIRE') {
                  // Instant Impact Squish
                  obj.scale.set(1.2, 0.5, 1.2);
              }
              else if (state.current === 'COOLDOWN') {
                  // Smoothly recover from Squish (1.2, 0.5, 1.2) -> Normal (1.0)
                  const maxTime = 0.5;
                  const remaining = Math.max(0, state.timers.action);
                  const progress = 1.0 - (remaining / maxTime); 
                  
                  // Stay squished briefly for impact feel, then spring up
                  if (progress < 0.2) {
                      obj.scale.set(1.2, 0.5, 1.2);
                  } else {
                      const recoverT = (progress - 0.2) / 0.8;
                      // Elastic ease-out effect
                      const elastic = 1 + Math.sin(recoverT * Math.PI * 3) * Math.pow(1 - recoverT, 2) * 0.2;
                      
                      const sX = THREE.MathUtils.lerp(1.2, 1.0, recoverT);
                      const sY = THREE.MathUtils.lerp(0.5, 1.0, recoverT) * elastic;
                      const sZ = THREE.MathUtils.lerp(1.2, 1.0, recoverT);
                      obj.scale.set(sX, sY, sZ);
                  }
              } 
              else if (state.current === 'CHARGING') {
                  // GROW: 1.0 -> 1.6
                  const maxTime = 2.0;
                  const progress = 1.0 - (Math.max(0, state.timers.action) / maxTime);
                  const scale = 1.0 + (progress * 0.6); 
                  obj.scale.setScalar(scale);
              }
              else if (state.current === 'READY') {
                  // HOLD: Maintain ~1.6 scale with pulse
                  const pulse = 1.6 + Math.sin(performance.now() * 0.005) * 0.05;
                  obj.scale.setScalar(pulse);
              }
              else {
                  obj.scale.setScalar(1.0);
              }
          }
      }}
    />
  );
};
