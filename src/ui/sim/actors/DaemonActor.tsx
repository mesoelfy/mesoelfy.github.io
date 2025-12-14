import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Tag } from '@/engine/ecs/types';
import { EnemyTypes } from '@/sys/config/Identifiers';
import { InstancedActor } from './InstancedActor';
import { IdentityData } from '../data/IdentityData';
import { AIStateData } from '../data/AIStateData';

export const DaemonActor = () => {
  const geometry = useMemo(() => new THREE.OctahedronGeometry(0.6, 0), []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({ 
      color: '#00F0FF', 
      wireframe: true,
      transparent: true,
      opacity: 0.8
  }), []);
  
  const brokenColor = useMemo(() => new THREE.Color('#FF003C'), []);
  const baseColor = useMemo(() => new THREE.Color('#00F0FF'), []);

  return (
    <InstancedActor 
      tag={Tag.PLAYER} 
      geometry={geometry} 
      material={material} 
      maxCount={5}
      filter={(e) => e.getComponent<IdentityData>('Identity')?.variant === EnemyTypes.DAEMON}
      updateEntity={(e, obj, color, delta) => {
          const state = e.getComponent<AIStateData>('State');
          
          // Reset color
          color.copy(baseColor);

          if (state) {
              // --- SPIN PHYSICS ---
              if (typeof state.data.visualSpin !== 'number') state.data.visualSpin = 0;
              let targetSpeed = 1.0;

              if (state.current === 'CHARGING') targetSpeed = 15.0;
              else if (state.current === 'READY') targetSpeed = 3.0;
              else if (state.current === 'FIRE') targetSpeed = 20.0;
              else if (state.current === 'COOLDOWN') targetSpeed = -5.0;
              else if (state.current === 'BROKEN') {
                  targetSpeed = 30.0; 
                  color.copy(brokenColor);
                  // Shake effect
                  obj.position.x += (Math.random() - 0.5) * 0.2;
                  obj.position.y += (Math.random() - 0.5) * 0.2;
              }

              if (typeof state.data.currentSpinSpeed !== 'number') state.data.currentSpinSpeed = 1.0;
              
              // Smoothly interpolate spin speed (Inertia)
              state.data.currentSpinSpeed = THREE.MathUtils.lerp(state.data.currentSpinSpeed, targetSpeed, delta * 5.0);
              state.data.visualSpin += state.data.currentSpinSpeed * delta;
              obj.rotation.y = state.data.visualSpin;

              // --- SCALE / ANIMATION LOGIC ---
              
              if (state.current === 'FIRE') {
                  // Instant Impact Squish
                  obj.scale.set(1.2, 0.5, 1.2);
              }
              else if (state.current === 'COOLDOWN') {
                  // Recover: Squish (1.2, 0.5, 1.2) -> Normal (1.0)
                  const maxTime = 0.5;
                  const remaining = Math.max(0, state.timers.action);
                  const progress = 1.0 - (remaining / maxTime); 
                  
                  if (progress < 0.2) {
                      obj.scale.set(1.2, 0.5, 1.2);
                  } else {
                      const recoverT = (progress - 0.2) / 0.8;
                      const elastic = 1 + Math.sin(recoverT * Math.PI * 3) * Math.pow(1 - recoverT, 2) * 0.2;
                      
                      const sY = THREE.MathUtils.lerp(0.5, 1.0, recoverT) * elastic;
                      const sXZ = THREE.MathUtils.lerp(1.2, 1.0, recoverT);
                      obj.scale.set(sXZ, sY, sXZ);
                  }
              } 
              else if (state.current === 'CHARGING') {
                  // Grow based on SHIELD HP (0% -> 100%)
                  // This ensures it starts exactly at 1.0 (where Cooldown left off)
                  // and grows to 1.6 (max size)
                  const maxShield = state.data.maxShield || 10;
                  const currentShield = state.data.shieldHP || 0;
                  const ratio = Math.min(1.0, Math.max(0, currentShield / maxShield));
                  
                  // Lerp 1.0 -> 1.6
                  const scale = 1.0 + (ratio * 0.6); 
                  obj.scale.setScalar(scale);
              }
              else if (state.current === 'READY') {
                  // Pulse at max size (1.6 base)
                  const pulse = 1.6 + Math.sin(performance.now() * 0.005) * 0.05;
                  obj.scale.setScalar(pulse);
              }
              else if (state.current === 'BROKEN') {
                  // Shrivel / Glitch
                  const twitch = 0.7 + (Math.random() * 0.1);
                  obj.scale.setScalar(twitch);
              }
              else {
                  obj.scale.setScalar(1.0);
              }
          }
      }}
    />
  );
};
