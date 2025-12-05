import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameEngine } from '../core/GameEngine';
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

    const enemies = GameEngine.enemies;
    const cursor = ServiceLocator.inputSystem ? ServiceLocator.inputSystem.getCursorPosition() : {x:0, y:0};
    
    let count = 0;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.active || e.type !== EnemyTypes.HUNTER) continue;

      if (e.state === 'charge') {
        if (count >= MAX_CHARGES) break;

        const progress = Math.max(0, Math.min(1, 1.0 - (e.stateTimer || 0)));
        const scale = 1 - Math.pow(1 - progress, 3);

        const dx = cursor.x - e.x;
        const dy = cursor.y - e.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        const dirX = dist > 0 ? dx / dist : 0;
        const dirY = dist > 0 ? dy / dist : 1;

        const spawnX = e.x + (dirX * OFFSET_DISTANCE);
        const spawnY = e.y + (dirY * OFFSET_DISTANCE);

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
