import { useMemo } from 'react';
import * as THREE from 'three';
import { Tag } from '../core/ecs/types';
import { GAME_THEME } from '../theme';
import { EnemyTypes } from '../config/Identifiers';
import { InstancedActor } from './common/InstancedActor';
import { addBarycentricCoordinates, createHunterSpear } from '../utils/GeometryUtils';
import { IdentityComponent } from '../data/IdentityComponent';
import { StateComponent } from '../data/StateComponent';
import { MODEL_CONFIG } from '../config/ModelConfig';

const vertexShader = `
  #ifndef USE_INSTANCING_COLOR
  attribute vec3 instanceColor;
  #endif
  attribute vec3 barycentric;
  varying vec3 vColor;
  varying vec3 vBarycentric;
  void main() {
    vColor = instanceColor;
    vBarycentric = barycentric;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying vec3 vBarycentric;
  float edgeFactor(vec3 bary, float width) {
    vec3 d = fwidth(bary);
    vec3 a3 = smoothstep(vec3(0.0), d * width, bary);
    return min(min(a3.x, a3.y), a3.z);
  }
  void main() {
    float width = 1.5; 
    float edge = edgeFactor(vBarycentric, width);
    float glow = pow(1.0 - edge, 0.4); 
    vec3 coreColor = vColor;
    vec3 edgeColor = mix(vColor, vec3(1.0), 0.8);
    gl_FragColor = vec4(mix(coreColor, edgeColor, glow), 1.0);
  }
`;

export const EnemyRenderer = () => {
  const drillerGeo = useMemo(() => {
      const { radius, height, segments } = MODEL_CONFIG.DRILLER;
      return addBarycentricCoordinates(new THREE.ConeGeometry(radius, height, segments));
  }, []);

  // RESTORED: IcosahedronGeometry (Detail 0)
  const kamikazeGeo = useMemo(() => {
      return addBarycentricCoordinates(new THREE.IcosahedronGeometry(0.6, 0));
  }, []);

  const hunterGeo = useMemo(() => createHunterSpear(), []);

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader, fragmentShader, uniforms: {}, vertexColors: true,
    extensions: { derivatives: true }, side: THREE.DoubleSide,
  }), []);

  const chargeColor = useMemo(() => new THREE.Color(GAME_THEME.enemy.charge), []);

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
            
            // FIX: Ensure base scale is 1.0 before applying spawn effect
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
            
            // FIX: Ensure base scale is 1.0
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
            
            // FIX: Ensure base scale is 1.0
            obj.scale.setScalar(1.0);
            applySpawnEffect(obj, state);
        }}
      />
    </>
  );
};
