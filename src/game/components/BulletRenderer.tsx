import { useMemo } from 'react';
import * as THREE from 'three';
import { Tag } from '../core/ecs/types';
import { GAME_THEME } from '../theme';
import { InstancedActor } from './common/InstancedActor';

const vertexShader = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }
`;
const fragmentShader = `
  varying vec2 vUv;
  uniform vec3 uColor;
  float sdBox(vec2 p, vec2 b) { vec2 d = abs(p)-b; return length(max(d,0.0)) + min(max(d.x,d.y),0.0); }
  void main() {
    vec2 p = vUv - 0.5;
    float d = sdBox(p, vec2(0.1, 0.3));
    float core = 1.0 - smoothstep(0.0, 0.02, d);
    float glow = exp(-20.0 * max(0.0, d));
    vec3 color = mix(uColor, vec3(1.0), core);
    gl_FragColor = vec4(color, max(core, glow));
  }
`;

export const BulletRenderer = () => {
  const geometry = useMemo(() => new THREE.PlaneGeometry(1.2, 1.2), []); 
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader, fragmentShader,
    uniforms: { uColor: { value: new THREE.Color(GAME_THEME.bullet.plasma) } },
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);

  return (
    <InstancedActor 
      tag={Tag.BULLET} 
      geometry={geometry} 
      material={material} 
      maxCount={500} 
      filter={(e) => !e.hasTag(Tag.ENEMY)}
      updateEntity={(e, obj) => {
         // Fix Rotation offset for Bullets (pointing up vs right)
         obj.rotation.z -= Math.PI / 2;
      }}
    />
  );
};
