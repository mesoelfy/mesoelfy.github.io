import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ActiveEngine } from './GameDirector';
import { Tag } from '../core/ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { GAME_THEME } from '../theme';

const MAX_BULLETS = 200;
const tempObj = new THREE.Object3D();

const vertexShader = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }
`;
const fragmentShader = `
  varying vec2 vUv;
  uniform vec3 uColor;
  void main() {
    float dist = distance(vUv, vec2(0.5));
    float core = 1.0 - smoothstep(0.2, 0.25, dist);
    float glow = 1.0 - smoothstep(0.25, 0.5, dist);
    glow = pow(glow, 3.0); 
    vec3 finalColor = mix(uColor, vec3(1.0), core);
    float alpha = max(core, glow);
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const EnemyBulletRenderer = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(2.0, 2.0), []); 
  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader, fragmentShader, uniforms: { uColor: { value: new THREE.Color(GAME_THEME.bullet.hunter) } },
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);

  useFrame(() => {
    if (!meshRef.current || !ActiveEngine) return;
    const allBullets = ActiveEngine.registry.getByTag(Tag.BULLET);
    let count = 0;
    for (const b of allBullets) {
      if (!b.hasTag(Tag.ENEMY)) continue; 
      const transform = b.getComponent<TransformComponent>('Transform');
      if (!transform) continue;
      if (count >= MAX_BULLETS) break;
      tempObj.position.set(transform.x, transform.y, 0);
      tempObj.scale.set(1, 1, 1);
      tempObj.rotation.set(0,0,0); 
      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(count, tempObj.matrix);
      count++;
    }
    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, MAX_BULLETS]}>
      <primitive object={shaderMaterial} attach="material" />
    </instancedMesh>
  );
};
