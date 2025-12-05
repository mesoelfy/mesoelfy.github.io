import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameEngine } from '../core/GameEngine';
import { ServiceLocator } from '../core/ServiceLocator';
import { GAME_THEME } from '../theme';
import { EnemyTypes } from '../config/Identifiers';

const MAX_ENEMIES = 1000;
const tempObj = new THREE.Object3D();
const tempColor = new THREE.Color();
const chargeColor = new THREE.Color(GAME_THEME.enemy.charge);

export const EnemyRenderer = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.ConeGeometry(0.3, 0.8, 3), []);
  
  useFrame((state) => {
    if (!meshRef.current) return;

    const enemies = GameEngine.enemies;
    const cursor = ServiceLocator.inputSystem ? ServiceLocator.inputSystem.getCursorPosition() : {x:0, y:0};
    let count = 0;

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (!enemy.active) continue;
      if (count >= MAX_ENEMIES) break;

      tempObj.position.set(enemy.x, enemy.y, 0);
      
      let angle = 0;
      let scale = 1;
      
      if (enemy.type === EnemyTypes.KAMIKAZE) {
        angle = Math.atan2(enemy.vy, enemy.vx) - Math.PI / 2;
        tempObj.rotation.z = angle + 0.5; // Spin visual
        scale = 1.2;
        tempColor.set(GAME_THEME.enemy.kamikaze); 
      } 
      else if (enemy.type === EnemyTypes.HUNTER) {
        if (enemy.state === 'charge') {
            // ROTATION FIX: Look at player
            const dx = cursor.x - enemy.x;
            const dy = cursor.y - enemy.y;
            angle = Math.atan2(dy, dx) - Math.PI / 2;
            
            // Jitter
            tempObj.position.x += (Math.random() - 0.5) * 0.1;
            tempObj.position.y += (Math.random() - 0.5) * 0.1;
            
            const t = state.clock.elapsedTime * 20;
            const alpha = (Math.sin(t) + 1) / 2;
            tempColor.set(GAME_THEME.enemy.hunter).lerp(chargeColor, alpha);
            
            scale = 1.8;
        } else {
            // Standard velocity rotation
            angle = Math.atan2(enemy.vy, enemy.vx) - Math.PI / 2;
            tempColor.set(GAME_THEME.enemy.hunter);
            scale = 1.5;
        }
        tempObj.rotation.z = angle;
      } 
      else { // Muncher
        angle = Math.atan2(enemy.vy, enemy.vx) - Math.PI / 2;
        tempObj.rotation.z = angle;
        scale = enemy.isEating ? 1 + Math.sin(state.clock.elapsedTime * 20) * 0.2 : 1;
        tempColor.set(GAME_THEME.enemy.muncher); 
      }

      tempObj.scale.set(scale, scale, 1);
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
