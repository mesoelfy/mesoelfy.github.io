import { useMemo } from 'react';
import * as THREE from 'three';
import { Tag } from '@/engine/ecs/types';
import { EnemyTypes } from '@/sys/config/Identifiers';
import { InstancedActor } from './InstancedActor';
import { IdentityData } from '../data/IdentityData';
import { AIStateData } from '../data/AIStateData';
import { TransformData } from '../data/TransformData';

const vertexShader = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`;
const fragmentShader = `
  varying vec2 vUv; uniform vec3 uColor;
  void main() {
    float dist = distance(vUv, vec2(0.5));
    float core = 1.0 - smoothstep(0.2, 0.25, dist);
    float glow = pow(1.0 - smoothstep(0.25, 0.5, dist), 3.0);
    gl_FragColor = vec4(mix(uColor, vec3(1.0), core), max(core, glow));
  }
`;

export const DaemonChargeActor = () => {
  const geometry = useMemo(() => new THREE.PlaneGeometry(4.0, 4.0), []);
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader, fragmentShader,
    uniforms: { uColor: { value: new THREE.Color('#00F0FF') } }, 
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);

  return (
    <InstancedActor
      tag={Tag.PLAYER}
      geometry={geometry}
      material={material}
      maxCount={10}
      filter={(e) => {
          const id = e.getComponent<IdentityData>('Identity');
          const state = e.getComponent<AIStateData>('State');
          // Hide if BROKEN
          return id?.variant === EnemyTypes.DAEMON && (state?.current === 'CHARGING' || state?.current === 'READY');
      }}
      updateEntity={(e, obj) => {
          const transform = e.getComponent<TransformData>('Transform');
          const state = e.getComponent<AIStateData>('State');
          
          if (transform && state) {
              obj.position.copy(new THREE.Vector3(transform.x, transform.y, 0.1));
              obj.rotation.set(0,0,0);

              // SCALE BASED ON SHIELD HP
              const maxShield = state.data.maxShield || 10;
              const currentShield = state.data.shieldHP || 0;
              const healthRatio = Math.max(0, currentShield / maxShield);
              
              if (state.current === 'READY') {
                  // Pulse at full current size
                  const pulse = 1.0 + Math.sin(performance.now() * 0.01) * 0.1;
                  obj.scale.setScalar(healthRatio * pulse);
              } else {
                  obj.scale.setScalar(healthRatio);
              }
          }
      }}
    />
  );
};
