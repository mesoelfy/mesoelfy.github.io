import { useMemo } from 'react';
import * as THREE from 'three';
import { Tag } from '@/engine/ecs/types';
import { InstancedActor } from './common/InstancedActor';
import { IdentityComponent } from '../data/IdentityComponent';

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

export const DaemonBulletRenderer = () => {
  // UPDATED: Scaled down by 20% (5.0 -> 4.0)
  const geometry = useMemo(() => new THREE.PlaneGeometry(4.0, 4.0), []); 
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader, fragmentShader,
    uniforms: { uColor: { value: new THREE.Color('#00F0FF') } }, // CYAN
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);

  return (
    <InstancedActor 
      tag={Tag.BULLET} 
      geometry={geometry} 
      material={material} 
      maxCount={50}
      filter={(e) => {
          if (e.hasTag(Tag.ENEMY)) return false;
          const id = e.getComponent<IdentityComponent>('Identity');
          return id?.variant === 'DAEMON_SHOT';
      }}
      updateEntity={(e, obj) => {
          obj.rotation.set(0,0,0);
          obj.scale.setScalar(1.0);
      }}
    />
  );
};
