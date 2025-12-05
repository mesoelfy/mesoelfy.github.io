import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Registry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { ServiceLocator } from '../core/ServiceLocator';
import { GAME_THEME } from '../theme';
import { EnemyTypes } from '../config/Identifiers';

const MAX_CHARGES = 50;
const tempObj = new THREE.Object3D();
const OFFSET_DISTANCE = 1.6; 

export const HunterChargeRenderer = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.CircleGeometry(0.9, 16), []);

  useFrame(() => {
    if (!meshRef.current) return;

    const enemies = Registry.getByTag(Tag.ENEMY);
    let cursor = { x: 0, y: 0 };
    try { cursor = ServiceLocator.getInputService().getCursor(); } catch {}
    
    let count = 0;

    for (const e of enemies) {
      const identity = e.getComponent<IdentityComponent>('Identity');
      if (!identity || identity.variant !== EnemyTypes.HUNTER) continue;

      // HACK: Access dynamic state property
      if ((e as any)._hunterState === 'charge') {
        const transform = e.getComponent<TransformComponent>('Transform');
        if (!transform) continue;

        if (count >= MAX_CHARGES) break;

        const timer = (e as any)._hunterTimer || 0;
        const progress = Math.max(0, Math.min(1, 1.0 - timer));
        const scale = 1 - Math.pow(1 - progress, 3);

        const dx = cursor.x - transform.x;
        const dy = cursor.y - transform.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        const dirX = dist > 0 ? dx / dist : 0;
        const dirY = dist > 0 ? dy / dist : 1;

        const spawnX = transform.x + (dirX * OFFSET_DISTANCE);
        const spawnY = transform.y + (dirY * OFFSET_DISTANCE);

        tempObj.position.set(spawnX, spawnY, -0.1);
        tempObj.scale.set(scale, scale, 1);
        tempObj.rotation.z += 0.1;

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
      <meshBasicMaterial 
        color={GAME_THEME.bullet.hunter} 
        transparent 
        opacity={0.9} 
      />
    </instancedMesh>
  );
};
