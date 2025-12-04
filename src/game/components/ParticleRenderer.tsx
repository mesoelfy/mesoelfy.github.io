import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameEngine } from '../core/GameEngine';

const MAX_PARTICLES = 1000;
const tempObj = new THREE.Object3D();
const tempColor = new THREE.Color();

export const ParticleRenderer = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(0.1, 0.1), []);

  useFrame(() => {
    if (!meshRef.current) return;

    const particles = GameEngine.particles;
    let count = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (!p.active) continue;
      if (count >= MAX_PARTICLES) break;

      tempObj.position.set(p.x, p.y, 0);
      const scale = p.life / p.maxLife; 
      tempObj.scale.set(scale, scale, 1);
      
      // FIXED: Apply instance color
      tempColor.set(p.color);
      
      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(count, tempObj.matrix);
      meshRef.current.setColorAt(count, tempColor);
      
      count++;
    }

    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, MAX_PARTICLES]}>
      <meshBasicMaterial color="white" />
    </instancedMesh>
  );
};
