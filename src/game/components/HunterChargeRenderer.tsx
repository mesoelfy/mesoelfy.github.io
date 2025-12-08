import { useMemo } from 'react';
import * as THREE from 'three';
import { Tag } from '../core/ecs/types';
import { GAME_THEME } from '../theme';
import { EnemyTypes } from '../config/Identifiers';
import { InstancedActor } from './common/InstancedActor';
import { IdentityComponent } from '../data/IdentityComponent';
import { StateComponent } from '../data/StateComponent';
import { TransformComponent } from '../data/TransformComponent';

// Reuse Shader Logic from EnemyBullet (Same Orb visual)
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

export const HunterChargeRenderer = () => {
  const geometry = useMemo(() => new THREE.PlaneGeometry(2.0, 2.0), []);
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader, fragmentShader,
    uniforms: { uColor: { value: new THREE.Color(GAME_THEME.bullet.hunter) } },
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);

  return (
    <InstancedActor
      tag={Tag.ENEMY}
      geometry={geometry}
      material={material}
      maxCount={50}
      filter={(e) => {
          const id = e.getComponent<IdentityComponent>('Identity');
          const state = e.getComponent<StateComponent>('State');
          return id?.variant === EnemyTypes.HUNTER && state?.current === 'CHARGE';
      }}
      updateEntity={(e, obj) => {
          const transform = e.getComponent<TransformComponent>('Transform');
          const state = e.getComponent<StateComponent>('State');
          if (transform && state) {
              const progress = Math.max(0, Math.min(1, 1.0 - (state.timers.state || 0)));
              const scale = Math.min(1.0, progress * 1.1);
              
              const offset = 1.6;
              const dirX = Math.cos(transform.rotation + Math.PI/2);
              const dirY = Math.sin(transform.rotation + Math.PI/2);
              
              // Override position to be in front of Hunter
              obj.position.x += dirX * offset;
              obj.position.y += dirY * offset;
              obj.position.z = 0.1; // Layer above
              obj.scale.setScalar(scale);
              obj.rotation.set(0,0,0);
          }
      }}
    />
  );
};
