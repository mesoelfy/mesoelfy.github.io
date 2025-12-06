import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Registry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { StateComponent } from '../components/data/StateComponent';
import { GAME_THEME } from '../theme';
import { EnemyTypes } from '../config/Identifiers';
import { addBarycentricCoordinates, createHunterSpear } from '../utils/GeometryUtils';

const MAX_ENEMIES = 1000;
const tempObj = new THREE.Object3D();
const tempColor = new THREE.Color();
const chargeColor = new THREE.Color(GAME_THEME.enemy.charge);

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
    // FIX: Thicker lines (2.0)
    float width = 2.0; 
    float edge = edgeFactor(vBarycentric, width);
    float glow = 1.0 - edge;
    glow = pow(glow, 0.4); 
    
    vec3 coreColor = vColor;
    vec3 edgeColor = mix(vColor, vec3(1.0), 0.6); // Brighter edges
    vec3 finalColor = mix(coreColor, edgeColor, glow);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export const EnemyRenderer = () => {
  const drillerRef = useRef<THREE.InstancedMesh>(null);
  const kamikazeRef = useRef<THREE.InstancedMesh>(null);
  const hunterRef = useRef<THREE.InstancedMesh>(null);
  
  const drillerGeo = useMemo(() => {
      const geo = new THREE.ConeGeometry(0.3, 0.8, 4); 
      return addBarycentricCoordinates(geo);
  }, []);
  
  const kamikazeGeo = useMemo(() => {
      const geo = new THREE.IcosahedronGeometry(0.6, 0); 
      return addBarycentricCoordinates(geo);
  }, []);
  
  const hunterGeo = useMemo(() => {
      return createHunterSpear();
  }, []);

  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {},
    vertexColors: true,
    extensions: { derivatives: true },
    side: THREE.DoubleSide, // FIX: Render both sides for visibility
  }), []);

  useFrame((state) => {
    if (!drillerRef.current || !kamikazeRef.current || !hunterRef.current) return;

    const enemies = Registry.getByTag(Tag.ENEMY);
    const currentTime = state.clock.elapsedTime;
    
    let mCount = 0;
    let kCount = 0;
    let hCount = 0;

    for (const e of enemies) {
      const transform = e.getComponent<TransformComponent>('Transform');
      const identity = e.getComponent<IdentityComponent>('Identity');
      
      if (!transform || !identity) continue;

      // FIX: Z=5.0 to ensure they are well above the panel plane
      tempObj.position.set(transform.x, transform.y, 5.0);
      
      tempObj.rotation.set(0, 0, transform.rotation); 
      tempObj.scale.set(transform.scale, transform.scale, 1);
      
      const type = identity.variant;
      
      if (type === EnemyTypes.DRILLER) {
        if (mCount >= MAX_ENEMIES) continue;
        
        // Pure spin on Y
        const stateComp = e.getComponent<StateComponent>('State');
        const speed = (stateComp && stateComp.current === 'DRILLING') ? 20.0 : 5.0;
        tempObj.rotateY(currentTime * speed); 

        tempColor.set(GAME_THEME.enemy.muncher);
        tempObj.updateMatrix();
        drillerRef.current.setMatrixAt(mCount, tempObj.matrix);
        drillerRef.current.setColorAt(mCount, tempColor);
        mCount++;
      }
      else if (type === EnemyTypes.KAMIKAZE) {
        if (kCount >= MAX_ENEMIES) continue;
        
        tempObj.rotateX(currentTime);
        tempObj.rotateY(currentTime * 0.5);
        
        tempColor.set(GAME_THEME.enemy.kamikaze);
        tempObj.updateMatrix();
        kamikazeRef.current.setMatrixAt(kCount, tempObj.matrix);
        kamikazeRef.current.setColorAt(kCount, tempColor);
        kCount++;
      }
      else if (type === EnemyTypes.HUNTER) {
        if (hCount >= MAX_ENEMIES) continue;
        
        const stateComp = e.getComponent<StateComponent>('State');
        const isCharging = stateComp && stateComp.current === 'CHARGE';
        
        tempColor.set(GAME_THEME.enemy.hunter);
        if (isCharging) {
             const alpha = (Math.sin(currentTime * 20) + 1) / 2;
             tempColor.lerp(chargeColor, alpha);
        }
        
        const spin = stateComp?.data?.spinAngle || 0;
        tempObj.rotateY(spin);

        tempObj.updateMatrix();
        hunterRef.current.setMatrixAt(hCount, tempObj.matrix);
        hunterRef.current.setColorAt(hCount, tempColor);
        hCount++;
      }
    }

    drillerRef.current.count = mCount;
    drillerRef.current.instanceMatrix.needsUpdate = true;
    if (drillerRef.current.instanceColor) drillerRef.current.instanceColor.needsUpdate = true;

    kamikazeRef.current.count = kCount;
    kamikazeRef.current.instanceMatrix.needsUpdate = true;
    if (kamikazeRef.current.instanceColor) kamikazeRef.current.instanceColor.needsUpdate = true;

    hunterRef.current.count = hCount;
    hunterRef.current.instanceMatrix.needsUpdate = true;
    if (hunterRef.current.instanceColor) hunterRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
        <instancedMesh ref={drillerRef} args={[drillerGeo, shaderMaterial, MAX_ENEMIES]} />
        <instancedMesh ref={kamikazeRef} args={[kamikazeGeo, shaderMaterial, MAX_ENEMIES]} />
        <instancedMesh ref={hunterRef} args={[hunterGeo, shaderMaterial, MAX_ENEMIES]} />
    </group>
  );
};
