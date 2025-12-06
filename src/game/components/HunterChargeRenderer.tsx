import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Registry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { StateComponent } from '../components/data/StateComponent';
import { GAME_THEME } from '../theme';
import { EnemyTypes } from '../config/Identifiers';

const MAX_CHARGES = 50;
const tempObj = new THREE.Object3D();
const OFFSET_DISTANCE = 1.6; 

// --- ORB SHADER (Same as Bullet) ---
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
  
  void main() {
    float dist = distance(vUv, vec2(0.5));
    // Hard Core
    float core = 1.0 - smoothstep(0.2, 0.25, dist);
    // Glow Halo
    float glow = 1.0 - smoothstep(0.25, 0.5, dist);
    glow = pow(glow, 3.0); 
    
    vec3 finalColor = mix(uColor, vec3(1.0), core);
    float alpha = max(core, glow);

    if (alpha < 0.01) discard;
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const HunterChargeRenderer = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(2.0, 2.0), []);
  
  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uColor: { value: new THREE.Color(GAME_THEME.bullet.hunter) }
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame(() => {
    if (!meshRef.current) return;

    const enemies = Registry.getByTag(Tag.ENEMY);
    let count = 0;

    for (const e of enemies) {
      const identity = e.getComponent<IdentityComponent>('Identity');
      if (!identity || identity.variant !== EnemyTypes.HUNTER) continue;

      const state = e.getComponent<StateComponent>('State');
      
      if (state && state.current === 'CHARGE') {
        const transform = e.getComponent<TransformComponent>('Transform');
        if (!transform) continue;

        if (count >= MAX_CHARGES) break;

        const timer = state.timers.state || 0;
        const progress = Math.max(0, Math.min(1, 1.0 - timer));
        const scale = 1 - Math.pow(1 - progress, 3);

        // Position: Relative to Hunter, slightly in front
        // We calculate direction based on current Hunter rotation? 
        // No, hunter rotates to face player.
        const dirX = Math.cos(transform.rotation + Math.PI/2);
        const dirY = Math.sin(transform.rotation + Math.PI/2);

        const spawnX = transform.x + (dirX * OFFSET_DISTANCE);
        const spawnY = transform.y + (dirY * OFFSET_DISTANCE);

        tempObj.position.set(spawnX, spawnY, -0.1);
        tempObj.scale.set(scale, scale, 1);
        tempObj.rotation.set(0, 0, 0); 

        tempObj.updateMatrix();
        meshRef.current.setMatrixAt(count, tempObj.matrix);
        count++;
      }
    }

    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, MAX_CHARGES]}>
      <primitive object={shaderMaterial} attach="material" />
    </instancedMesh>
  );
};
