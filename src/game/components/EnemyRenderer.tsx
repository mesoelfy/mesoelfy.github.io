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
  const muncherRef = useRef<THREE.InstancedMesh>(null);
  const kamikazeRef = useRef<THREE.InstancedMesh>(null);
  const hunterRef = useRef<THREE.InstancedMesh>(null);
  
  const muncherGeo = useMemo(() => new THREE.ConeGeometry(0.3, 0.8, 3), []);
  const kamikazeGeo = useMemo(() => new THREE.IcosahedronGeometry(0.4, 0), []);
  const hunterGeo = useMemo(() => new THREE.ConeGeometry(0.3, 0.8, 3), []);
  
  useFrame((state) => {
    if (!muncherRef.current || !kamikazeRef.current || !hunterRef.current) return;

    const enemies = GameEngine.enemies;
    const currentTime = state.clock.elapsedTime;
    const cursor = ServiceLocator.inputSystem ? ServiceLocator.inputSystem.getCursorPosition() : {x:0, y:0};
    
    let mCount = 0;
    let kCount = 0;
    let hCount = 0;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.active) continue;

      tempObj.position.set(e.x, e.y, 0);
      
      const age = currentTime - (e.spawnTime || 0);
      const spawnScale = Math.min(1.0, age * 3.0); 
      const elastic = spawnScale === 1 ? 1 : 1 - Math.pow(2, -10 * spawnScale) * Math.sin((spawnScale - 0.075) * (2 * Math.PI) / 0.3);

      // --- MUNCHER ---
      if (e.type === EnemyTypes.MUNCHER) {
        if (mCount >= MAX_ENEMIES) continue;
        
        const angle = Math.atan2(e.vy, e.vx) - Math.PI / 2;
        tempObj.rotation.set(0, 0, angle);
        
        const baseScale = e.isEating ? 1 + Math.sin(state.clock.elapsedTime * 20) * 0.2 : 1;
        const finalScale = baseScale * elastic;
        tempObj.scale.set(finalScale, finalScale, 1);
        
        tempColor.set(GAME_THEME.enemy.muncher);
        
        tempObj.updateMatrix();
        muncherRef.current.setMatrixAt(mCount, tempObj.matrix);
        muncherRef.current.setColorAt(mCount, tempColor);
        mCount++;
      }
      
      // --- KAMIKAZE ---
      else if (e.type === EnemyTypes.KAMIKAZE) {
        if (kCount >= MAX_ENEMIES) continue;
        
        const angle = Math.atan2(e.vy, e.vx) - Math.PI / 2;
        tempObj.rotation.set(0, 0, angle + (currentTime * 5)); // Spin
        
        const finalScale = 1.3 * elastic;
        tempObj.scale.set(finalScale, finalScale, finalScale);
        
        tempColor.set(GAME_THEME.enemy.kamikaze);
        
        tempObj.updateMatrix();
        kamikazeRef.current.setMatrixAt(kCount, tempObj.matrix);
        kamikazeRef.current.setColorAt(kCount, tempColor);
        kCount++;
      }
      
      // --- HUNTER ---
      else if (e.type === EnemyTypes.HUNTER) {
        if (hCount >= MAX_ENEMIES) continue;
        
        let angle = 0;
        let baseScale = 1.5;
        
        if (e.state === 'charge') {
            const dx = cursor.x - e.x;
            const dy = cursor.y - e.y;
            angle = Math.atan2(dy, dx) - Math.PI / 2;
            
            tempObj.position.x += (Math.random() - 0.5) * 0.1;
            tempObj.position.y += (Math.random() - 0.5) * 0.1;
            
            const t = state.clock.elapsedTime * 20;
            const alpha = (Math.sin(t) + 1) / 2;
            tempColor.set(GAME_THEME.enemy.hunter).lerp(chargeColor, alpha);
            baseScale = 1.8;
        } else {
            angle = Math.atan2(e.vy, e.vx) - Math.PI / 2;
            tempColor.set(GAME_THEME.enemy.hunter);
        }
        
        tempObj.rotation.set(0, 0, angle);
        const finalScale = baseScale * elastic;
        tempObj.scale.set(finalScale, finalScale, 1);
        
        tempObj.updateMatrix();
        hunterRef.current.setMatrixAt(hCount, tempObj.matrix);
        hunterRef.current.setColorAt(hCount, tempColor);
        hCount++;
      }
    }

    muncherRef.current.count = mCount;
    kamikazeRef.current.count = kCount;
    hunterRef.current.count = hCount;
    
    muncherRef.current.instanceMatrix.needsUpdate = true;
    // FIX: Add safety checks
    if (muncherRef.current.instanceColor) muncherRef.current.instanceColor.needsUpdate = true;
    
    kamikazeRef.current.instanceMatrix.needsUpdate = true;
    if (kamikazeRef.current.instanceColor) kamikazeRef.current.instanceColor.needsUpdate = true;
    
    hunterRef.current.instanceMatrix.needsUpdate = true;
    if (hunterRef.current.instanceColor) hunterRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
        <instancedMesh ref={muncherRef} args={[muncherGeo, undefined, MAX_ENEMIES]}>
            <meshBasicMaterial color="white" />
        </instancedMesh>
        <instancedMesh ref={kamikazeRef} args={[kamikazeGeo, undefined, MAX_ENEMIES]}>
            <meshBasicMaterial color="white" />
        </instancedMesh>
        <instancedMesh ref={hunterRef} args={[hunterGeo, undefined, MAX_ENEMIES]}>
            <meshBasicMaterial color="white" />
        </instancedMesh>
    </group>
  );
};
