import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Registry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { GAME_THEME } from '../theme';

const MAX_BULLETS = 500;
const tempObj = new THREE.Object3D();

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform vec3 uColor;
  
  float sdBox(in vec2 p, in vec2 b) {
      vec2 d = abs(p)-b;
      return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
  }

  void main() {
    vec2 p = vUv - 0.5;
    
    // FIX: Reduced box size from (0.15, 0.4) to (0.1, 0.3) for a tighter projectile
    vec2 boxSize = vec2(0.1, 0.3); 
    
    float d = sdBox(p, boxSize);
    
    float core = 1.0 - smoothstep(0.0, 0.02, d);
    float glow = exp(-20.0 * max(0.0, d));
    
    vec3 color = mix(uColor, vec3(1.0), core); 
    float alpha = max(core, glow);

    gl_FragColor = vec4(color, alpha);
  }
`;

export const BulletRenderer = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Reduced geometry plane size slightly to match new visual scale
  const geometry = useMemo(() => new THREE.PlaneGeometry(1.2, 1.2), []); 
  
  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uColor: { value: new THREE.Color(GAME_THEME.bullet.plasma) }
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame(() => {
    if (!meshRef.current) return;
    
    const allBullets = Registry.getByTag(Tag.BULLET);
    let count = 0;

    for (const b of allBullets) {
      if (b.hasTag(Tag.ENEMY)) continue; 
      
      const transform = b.getComponent<TransformComponent>('Transform');
      if (!transform) continue;

      if (count >= MAX_BULLETS) break;

      tempObj.position.set(transform.x, transform.y, 0);
      tempObj.rotation.z = transform.rotation - (Math.PI / 2);
      
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
