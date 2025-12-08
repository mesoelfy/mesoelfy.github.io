import { useMemo } from 'react';
import * as THREE from 'three';
import { Tag } from '../core/ecs/types';
import { GAME_THEME } from '../theme';
import { InstancedActor } from './common/InstancedActor';
import { HealthComponent } from '../components/data/HealthComponent';

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

export const EnemyBulletRenderer = () => {
  const geometry = useMemo(() => new THREE.PlaneGeometry(2.0, 2.0), []); 
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader, fragmentShader,
    uniforms: { uColor: { value: new THREE.Color(GAME_THEME.bullet.hunter) } },
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);

  return (
    <InstancedActor 
      tag={Tag.BULLET} 
      geometry={geometry} 
      material={material} 
      maxCount={200}
      filter={(e) => e.hasTag(Tag.ENEMY)}
      updateEntity={(e, obj) => {
          // Scale based on Health (Mass)
          const hp = e.getComponent<HealthComponent>('Health');
          let scale = 1.0;
          
          if (hp) {
              // Hunter Orbs are 3HP max.
              // 3/3 = 1.0
              // 2/3 = 0.8
              // 1/3 = 0.6
              scale = 0.4 + (0.6 * (hp.current / hp.max));
          }

          obj.rotation.set(0,0,0);
          obj.scale.setScalar(scale);
      }}
    />
  );
};
