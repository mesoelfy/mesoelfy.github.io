import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameEngine } from '../core/GameEngine';
import { GAME_THEME } from '../theme';

const MAX_ENEMIES = 1000;
const tempObj = new THREE.Object3D();
const tempColor = new THREE.Color();

export const EnemyRenderer = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Geometry: A simple Triangle
  const geometry = useMemo(() => new THREE.ConeGeometry(0.3, 0.8, 3), []);
  
  useFrame((state) => {
    if (!meshRef.current) return;

    const enemies = GameEngine.enemies;
    let count = 0;

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (!enemy.active) continue;
      if (count >= MAX_ENEMIES) break;

      // Position
      tempObj.position.set(enemy.x, enemy.y, 0);
      
      // Visuals based on Type
      if (enemy.type === 'kamikaze') {
        // Spin wild
        tempObj.rotation.z += 0.5; 
        tempObj.scale.set(1.2, 1.2, 1);
        tempColor.set(GAME_THEME.enemy.eater); // Red
      } else if (enemy.type === 'hunter') {
        // Face Player
        const angle = Math.atan2(enemy.vy, enemy.vx) - Math.PI / 2;
        tempObj.rotation.z = angle;
        tempObj.scale.set(1.5, 1.5, 1); // Bigger
        tempColor.set(GAME_THEME.enemy.boss); // Orange/Yellow
      } else {
        // Muncher (Standard)
        const angle = Math.atan2(enemy.vy, enemy.vx) - Math.PI / 2;
        tempObj.rotation.z = angle;
        // Pulse if eating
        const scale = enemy.isEating ? 1 + Math.sin(state.clock.elapsedTime * 20) * 0.2 : 1;
        tempObj.scale.set(scale, scale, 1);
        tempColor.set(GAME_THEME.enemy.muncher); // Purple
      }

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
    <instancedMesh ref={meshRef} args={[geometry, undefined, MAX_ENEMIES]}>
      <meshBasicMaterial color="white" />
    </instancedMesh>
  );
};
