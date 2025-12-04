import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameEngine } from '../core/GameEngine';
import { GAME_THEME } from '../theme';

const MAX_BULLETS = 200;
const tempObj = new THREE.Object3D();

export const EnemyBulletRenderer = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // 3x Size Increase (0.3 -> 0.9). Increased segments for smoothness.
  const geometry = useMemo(() => new THREE.CircleGeometry(0.9, 16), []); 

  useFrame(() => {
    if (!meshRef.current) return;

    const bullets = GameEngine.enemyBullets;
    let count = 0;

    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      if (!b.active) continue;

      if (count >= MAX_BULLETS) break;

      tempObj.position.set(b.x, b.y, 0);
      tempObj.scale.set(1, 1, 1);
      
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
      <meshBasicMaterial color={GAME_THEME.bullet.hunter} />
    </instancedMesh>
  );
};
