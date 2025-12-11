import { Tag } from '../core/ecs/types';
import { GAME_THEME } from '../theme';
import { EnemyTypes } from '../config/Identifiers';
import { InstancedActor } from './common/InstancedActor';
import { IdentityComponent } from '../data/IdentityComponent';
import { StateComponent } from '../data/StateComponent';
import { AssetService } from '../assets/AssetService';
import * as THREE from 'three';

export const EnemyRenderer = () => {
  // Use Assets from Service (Singleton Cache)
  const drillerGeo = AssetService.get<THREE.BufferGeometry>('GEO_DRILLER');
  const kamikazeGeo = AssetService.get<THREE.BufferGeometry>('GEO_KAMIKAZE');
  const hunterGeo = AssetService.get<THREE.BufferGeometry>('GEO_HUNTER');
  const material = AssetService.get<THREE.Material>('MAT_ENEMY_BASE');

  const chargeColor = new THREE.Color(GAME_THEME.enemy.charge);

  const applySpawnEffect = (obj: THREE.Object3D, state?: StateComponent) => {
      if (state && state.current === 'SPAWN') {
          const progress = 1.0 - (state.timers.spawn / 1.5);
          const eased = Math.pow(progress, 2); 
          obj.scale.setScalar(eased);
          obj.position.x += (Math.random() - 0.5) * 0.1 * (1-progress);
      }
  };

  return (
    <>
      <InstancedActor 
        tag={Tag.ENEMY}
        geometry={drillerGeo}
        material={material}
        maxCount={500}
        baseColor={GAME_THEME.enemy.muncher}
        colorSource="base" 
        filter={e => e.getComponent<IdentityComponent>('Identity')?.variant === EnemyTypes.DRILLER}
        updateEntity={(e, obj, color, delta) => {
            const state = e.getComponent<StateComponent>('State');
            const speed = (state && state.current === 'DRILLING') ? 20.0 : 5.0;
            obj.position.z = 5.0;
            obj.rotateY(performance.now() * 0.001 * speed); 
            obj.scale.setScalar(1.0); 
            applySpawnEffect(obj, state);
        }}
      />

      <InstancedActor 
        tag={Tag.ENEMY}
        geometry={kamikazeGeo}
        material={material}
        maxCount={200}
        baseColor={GAME_THEME.enemy.kamikaze}
        colorSource="base"
        filter={e => e.getComponent<IdentityComponent>('Identity')?.variant === EnemyTypes.KAMIKAZE}
        updateEntity={(e, obj, color, delta) => {
            const state = e.getComponent<StateComponent>('State');
            const time = performance.now() * 0.001;
            obj.position.z = 5.0;
            obj.rotation.set(time * 2, time, 0); 
            obj.scale.setScalar(1.0);
            applySpawnEffect(obj, state);
        }}
      />

      <InstancedActor 
        tag={Tag.ENEMY}
        geometry={hunterGeo}
        material={material}
        maxCount={100}
        baseColor={GAME_THEME.enemy.hunter}
        colorSource="base"
        filter={e => e.getComponent<IdentityComponent>('Identity')?.variant === EnemyTypes.HUNTER}
        updateEntity={(e, obj, color, delta) => {
            const state = e.getComponent<StateComponent>('State');
            const time = performance.now() * 0.001;
            if (state && state.current === 'CHARGE') {
                const alpha = (Math.sin(time * 20) + 1) / 2;
                color.lerp(chargeColor, alpha);
            }
            const spin = state?.data?.spinAngle || 0;
            obj.position.z = 5.0;
            obj.rotation.set(0, spin, 0);
            obj.scale.setScalar(1.0);
            applySpawnEffect(obj, state);
        }}
      />
    </>
  );
};
