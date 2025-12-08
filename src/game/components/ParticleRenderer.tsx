import { useMemo } from 'react';
import * as THREE from 'three';
import { Tag } from '../core/ecs/types';
import { InstancedActor } from './common/InstancedActor';
import { LifetimeComponent } from '../components/data/LifetimeComponent';

export const ParticleRenderer = () => {
  const geometry = useMemo(() => new THREE.PlaneGeometry(0.3, 0.3), []);
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: `
      #ifndef USE_INSTANCING_COLOR
      attribute vec3 instanceColor;
      #endif
      varying vec2 vUv;
      varying vec3 vColor;
      void main() { vUv = uv; vColor = instanceColor; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vColor;
      void main() {
        float dist = distance(vUv, vec2(0.5));
        float alpha = pow(1.0 - smoothstep(0.0, 0.5, dist), 3.0);
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);

  return (
    <InstancedActor 
      tag={Tag.PARTICLE} 
      geometry={geometry} 
      material={material} 
      maxCount={1000}
      colorSource="identity"
      updateEntity={(e, obj, color) => {
         const life = e.getComponent<LifetimeComponent>('Lifetime');
         if (life) {
             const scale = life.remaining / life.total;
             obj.scale.setScalar(scale);
             
             // VOLUMETRIC EFFECT:
             // Enemies are at Z=5.0. 
             // We split particles 50/50 to be In Front (6.0) or Behind (4.0).
             // Using ID ensures it doesn't flicker frame-to-frame.
             const isInFront = (e.id as number) % 2 === 0;
             obj.position.z = isInFront ? 6.0 : 4.0;
         }
      }}
    />
  );
};
