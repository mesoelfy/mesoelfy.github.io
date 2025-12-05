import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Registry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { StateComponent } from '../components/data/StateComponent'; // NEW
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

    const enemies = Registry.getByTag(Tag.ENEMY);
    const currentTime = state.clock.elapsedTime;
    
    let mCount = 0;
    let kCount = 0;
    let hCount = 0;

    for (const e of enemies) {
      const transform = e.getComponent<TransformComponent>('Transform');
      const identity = e.getComponent<IdentityComponent>('Identity');
      
      if (!transform || !identity) continue;

      tempObj.position.set(transform.x, transform.y, 0);
      tempObj.rotation.z = transform.rotation;
      tempObj.scale.set(transform.scale, transform.scale, 1);
      
      const type = identity.variant;
      
      if (type === EnemyTypes.MUNCHER) {
        if (mCount >= MAX_ENEMIES) continue;
        tempColor.set(GAME_THEME.enemy.muncher);
        tempObj.updateMatrix();
        muncherRef.current.setMatrixAt(mCount, tempObj.matrix);
        muncherRef.current.setColorAt(mCount, tempColor);
        mCount++;
      }
      else if (type === EnemyTypes.KAMIKAZE) {
        if (kCount >= MAX_ENEMIES) continue;
        tempColor.set(GAME_THEME.enemy.kamikaze);
        tempObj.updateMatrix();
        kamikazeRef.current.setMatrixAt(kCount, tempObj.matrix);
        kamikazeRef.current.setColorAt(kCount, tempColor);
        kCount++;
      }
      else if (type === EnemyTypes.HUNTER) {
        if (hCount >= MAX_ENEMIES) continue;
        
        // FIX: Read from State Component
        const stateComp = e.getComponent<StateComponent>('State');
        const isCharging = stateComp && stateComp.current === 'CHARGE';
        
        tempColor.set(GAME_THEME.enemy.hunter);
        if (isCharging) {
             const alpha = (Math.sin(currentTime * 20) + 1) / 2;
             tempColor.lerp(chargeColor, alpha);
        }
        tempObj.updateMatrix();
        hunterRef.current.setMatrixAt(hCount, tempObj.matrix);
        hunterRef.current.setColorAt(hCount, tempColor);
        hCount++;
      }
    }

    muncherRef.current.count = mCount;
    muncherRef.current.instanceMatrix.needsUpdate = true;
    if (muncherRef.current.instanceColor) muncherRef.current.instanceColor.needsUpdate = true;

    kamikazeRef.current.count = kCount;
    kamikazeRef.current.instanceMatrix.needsUpdate = true;
    if (kamikazeRef.current.instanceColor) kamikazeRef.current.instanceColor.needsUpdate = true;

    hunterRef.current.count = hCount;
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
