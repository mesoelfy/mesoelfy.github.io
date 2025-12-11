import { Tag } from '../core/ecs/types';
import { GAME_THEME } from '../theme';
import { EnemyTypes } from '../config/Identifiers';
import { InstancedActor } from './common/InstancedActor';
import { IdentityComponent } from '../data/IdentityComponent';
import { StateComponent } from '../data/StateComponent';
import { TransformComponent } from '../data/TransformComponent'; 
import { AssetService } from '../assets/AssetService';
import * as THREE from 'three';

// --- REUSABLE MATH OBJECTS (Zero-Allocation) ---
const axisY = new THREE.Vector3(0, 1, 0); // Model Axis (Up)
const axisZ = new THREE.Vector3(0, 0, 1); // World Axis (Forward/Screen)
const qSpin = new THREE.Quaternion();
const qAim = new THREE.Quaternion();

export const EnemyRenderer = () => {
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

  const applyRotation = (obj: THREE.Object3D, spin: number, aim: number) => {
      // 1. Spin around Local Y (Model Axis)
      qSpin.setFromAxisAngle(axisY, spin);
      
      // 2. Aim around World Z
      // Offset by -PI/2 because model points Up, but 0 radians is Right.
      qAim.setFromAxisAngle(axisZ, aim - Math.PI/2);
      
      // 3. Combine: Aim * Spin
      // This applies spin first (locally), then tilts the whole object to aim.
      qAim.multiply(qSpin);
      
      obj.quaternion.copy(qAim);
  };

  return (
    <>
      {/* DRILLER */}
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
            const transform = e.getComponent<TransformComponent>('Transform');
            
            const speed = (state && state.current === 'DRILLING') ? 20.0 : 5.0;
            const spin = performance.now() * 0.001 * speed;
            const aim = transform ? transform.rotation : 0;
            
            obj.position.z = 5.0;
            applyRotation(obj, spin, aim);
            
            obj.scale.setScalar(1.0); 
            applySpawnEffect(obj, state);
        }}
      />

      {/* KAMIKAZE */}
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
            
            // Kamikaze just tumbles chaotically
            obj.rotation.set(time * 2, time, 0); 
            
            obj.scale.setScalar(1.0);
            applySpawnEffect(obj, state);
        }}
      />

      {/* HUNTER */}
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
            const transform = e.getComponent<TransformComponent>('Transform');
            const time = performance.now() * 0.001;

            if (state && state.current === 'CHARGE') {
                const alpha = (Math.sin(time * 20) + 1) / 2;
                color.lerp(chargeColor, alpha);
            }
            
            const spin = state?.data?.spinAngle || 0;
            const aim = transform ? transform.rotation : 0;

            obj.position.z = 5.0;
            applyRotation(obj, spin, aim);
            
            obj.scale.setScalar(1.0);
            applySpawnEffect(obj, state);
        }}
      />
    </>
  );
};
