import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameEngine } from '../core/GameEngine';
import { GAME_THEME } from '../theme';

const MAX_BULLETS = 500;
const tempObj = new THREE.Object3D();

export const BulletRenderer = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Geometry: Small high-energy square
  const geometry = useMemo(() => new THREE.PlaneGeometry(0.15, 0.4), []); // Elongated slightly

  useFrame(() => {
    if (!meshRef.current) return;

    const bullets = GameEngine.bullets;
    let count = 0;

    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      if (!b.active) continue;

      if (count >= MAX_BULLETS) break;

      // Position
      tempObj.position.set(b.x, b.y, 0);
      
      // Rotation (Face velocity)
      const angle = Math.atan2(b.vy, b.vx) - Math.PI / 2;
      tempObj.rotation.z = angle;

      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(count, tempObj.matrix);
      count++;
    }

    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, MAX_BULLETS]}>
      <meshBasicMaterial color={GAME_THEME.bullet.plasma} />
    </instancedMesh>
  );
};
