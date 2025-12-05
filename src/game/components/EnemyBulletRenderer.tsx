import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Registry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { GAME_THEME } from '../theme';

const MAX_BULLETS = 200;
const tempObj = new THREE.Object3D();

export const EnemyBulletRenderer = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.CircleGeometry(0.9, 16), []); 

  useFrame(() => {
    if (!meshRef.current) return;

    const allBullets = Registry.getByTag(Tag.BULLET);
    let count = 0;

    for (const b of allBullets) {
      if (!b.hasTag(Tag.ENEMY)) continue; // Only enemy bullets

      const transform = b.getComponent<TransformComponent>('Transform');
      if (!transform) continue;

      if (count >= MAX_BULLETS) break;

      tempObj.position.set(transform.x, transform.y, 0);
      tempObj.scale.set(1, 1, 1);
      tempObj.rotation.z = transform.rotation;

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
