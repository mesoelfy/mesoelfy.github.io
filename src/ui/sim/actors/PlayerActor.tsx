import { useRef, useMemo, useEffect, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { GAME_THEME } from '@/ui/sim/config/theme';
import { Tag } from '@/engine/ecs/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { RenderTransform } from '@/engine/ecs/components/RenderTransform';
import { useStore } from '@/engine/state/global/useStore';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { IInteractionSystem } from '@/engine/interfaces';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { GameEvents } from '@/engine/signals/GameEvents';
import { MaterialFactory } from '@/engine/graphics/MaterialFactory';
import { ShaderLib } from '@/engine/graphics/ShaderLib';
import { useGameContext } from '@/engine/state/GameContext';
import { Uniforms } from '@/engine/graphics/Uniforms';
import { PALETTE } from '@/engine/config/Palette';
import { GAME_MATH } from '@/engine/config/constants/MathConstants';
import * as THREE from 'three';

const createCoreGeo = () => {
    const shape = new THREE.Shape();
    const R = 0.11, cR = 0.10;  
    const p1 = [0, R], p2 = [R*Math.cos(Math.PI*7/6), R*Math.sin(Math.PI*7/6)], p3 = [R*Math.cos(Math.PI*11/6), R*Math.sin(Math.PI*11/6)];
    shape.moveTo(p1[0], p1[1]);
    shape.quadraticCurveTo(cR*Math.cos(Math.PI*150/180), cR*Math.sin(Math.PI*150/180), p2[0], p2[1]);
    shape.quadraticCurveTo(cR*Math.cos(Math.PI*270/180), cR*Math.sin(Math.PI*270/180), p3[0], p3[1]);
    shape.quadraticCurveTo(cR*Math.cos(Math.PI*30/180), cR*Math.sin(Math.PI*30/180), p1[0], p1[1]);
    return new THREE.ShapeGeometry(shape);
};

const createReticleGeo = () => {
    const pts = 4, oR = 0.65, iR = 0.35, iF = 0.60, tA = 0.55; 
    const shape = new THREE.Shape(), step = (Math.PI*2)/pts;
    for (let i=0; i<pts; i++) {
        const theta = i*step, tip = theta-tA;
        if (i===0) shape.moveTo(Math.cos(tip)*oR, Math.sin(tip)*oR); else shape.lineTo(Math.cos(tip)*oR, Math.sin(tip)*oR);
        shape.lineTo(Math.cos(theta+step/2)*(oR*(1-iF)), Math.sin(theta+step/2)*(oR*(1-iF)));
    }
    const hole = new THREE.Path();
    for (let i=0; i<pts; i++) {
        const theta = i*step, tip = theta-(tA*0.5);
        if (i===0) hole.moveTo(Math.cos(tip)*iR, Math.sin(tip)*iR); else hole.lineTo(Math.cos(tip)*iR, Math.sin(tip)*iR);
        hole.lineTo(Math.cos(theta+step/2)*(iR*(1-iF)), Math.sin(theta+step/2)*(iR*(1-iF)));
    }
    shape.holes.push(hole);
    return new THREE.ShapeGeometry(shape);
};

// --- DYNAMIC TRIDENT GENERATOR ---
const createForkedChevronGeo = (tipCount: number) => {
    const shape = new THREE.Shape();
    
    // Radii
    const rOuter = 0.90; // Muzzle Tip
    const rValley = 0.86; // Between tips
    const rBase = 0.82; // Inner Base
    
    const spread = GAME_MATH.WEAPON_SPREAD_BASE; 
    const totalAngle = (tipCount - 1) * spread;
    
    // Aligned to WeaponLogic: Start at (Base - HalfTotal)
    // Relative to Up (PI/2), this is (PI/2 - HalfTotal)
    // We want to draw Left-to-Right (CW decreasing angle) or Right-to-Left (CCW increasing)?
    // WeaponLogic uses: baseAngle - halfTotal + (i * spread). (Increasing angle).
    // Increasing angle goes CCW (Right -> Left relative to Up).
    
    // Start Right (Smallest Angle)
    const startAngle = (Math.PI / 2) - (totalAngle / 2);
    
    // Helper: Polar to Cartesian
    const pt = (r: number, angle: number) => [r * Math.cos(angle), r * Math.sin(angle)];

    // 1. Trace Top Edge (Tips & Valleys)
    // Going CCW from Right to Left
    for (let i = 0; i < tipCount; i++) {
        const angle = startAngle + (i * spread);
        const pTip = pt(rOuter, angle);
        
        if (i === 0) shape.moveTo(pTip[0], pTip[1]);
        else shape.lineTo(pTip[0], pTip[1]);

        // Valley (if not last)
        if (i < tipCount - 1) {
            const midAngle = angle + (spread / 2);
            const pValley = pt(rValley, midAngle);
            shape.lineTo(pValley[0], pValley[1]);
        }
    }

    // 2. Trace Bottom Edge (Base Arc)
    // Going CW from Left to Right
    const leftBaseAngle = startAngle + ((tipCount - 1) * spread) + 0.04; 
    const rightBaseAngle = startAngle - 0.04;

    const pBaseLeft = pt(rBase, leftBaseAngle);
    shape.lineTo(pBaseLeft[0], pBaseLeft[1]);
    
    const pBaseRight = pt(rBase, rightBaseAngle);
    shape.lineTo(pBaseRight[0], pBaseRight[1]);
    
    shape.closePath();

    return new THREE.ShapeGeometry(shape);
};

const SnifferOverlayShader = {
  vertex: `
    varying vec2 vPos;
    void main() {
      vPos = position.xy;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: `
    uniform float uLevel;
    uniform vec3 uColor;
    uniform float uTime;
    varying vec2 vPos;
    #define PI 3.14159265359
    void main() {
      float angle = atan(vPos.y, vPos.x);
      float correctedAngle = angle + 0.55;
      if (correctedAngle < 0.0) correctedAngle += 2.0 * PI;
      float sectorRaw = floor((correctedAngle + (PI / 4.0)) / (PI / 2.0));
      int sector = int(mod(sectorRaw, 4.0));
      bool isActive = false;
      if (uLevel >= 1.0 && sector == 2) isActive = true;
      if (uLevel >= 2.0 && sector == 0) isActive = true;
      if (uLevel >= 3.0 && sector == 3) isActive = true;
      if (uLevel >= 4.0 && sector == 1) isActive = true;
      if (!isActive) discard;
      float dist = length(vPos);
      float tipMask = smoothstep(0.35, 0.65, dist);
      if (tipMask < 0.1) discard;
      float pulse = 0.8 + 0.2 * sin(uTime * 10.0);
      gl_FragColor = vec4(uColor, 1.0); 
    }
  `
};

const coreGeo = createCoreGeo(), reticleGeo = createReticleGeo(), glowPlaneGeo = new THREE.PlaneGeometry(1, 1);
const COL_BASE = new THREE.Color(GAME_THEME.turret.base), COL_REPAIR = new THREE.Color(GAME_THEME.turret.repair), COL_REBOOT = new THREE.Color('#9E4EA5'), COL_DEAD = new THREE.Color('#FF003C'), COL_HIT = new THREE.Color('#FF003C');
const COL_RET_HEAL = new THREE.Color(PALETTE.PINK.DEEP);
const COL_SNIFFER = new THREE.Color(PALETTE.PINK.PRIMARY);

export const PlayerActor = () => {
  const { registry, getSystem, events } = useGameContext();
  const containerRef = useRef<THREE.Group>(null);
  const centerDotRef = useRef<THREE.Mesh>(null);
  const reticleRef = useRef<THREE.Mesh>(null);
  const ambientGlowRef = useRef<THREE.Mesh>(null);
  const snifferRef = useRef<THREE.Mesh>(null);
  const forkRef = useRef<THREE.Mesh>(null); 
  
  const { introDone } = useStore(); 
  const isZenMode = useGameStore(state => state.isZenMode);
  const activeUpgrades = useGameStore(state => state.activeUpgrades);
  
  const animScale = useRef(0), tempColor = useRef(new THREE.Color()), reticleColor = useRef(new THREE.Color()), snifferColor = useRef(new THREE.Color());
  const currentEnergy = useRef(0.0), hitFlash = useRef(0.0), zenStartTime = useRef(-1), lastFireTimeRef = useRef(-100), targetAimAngle = useRef(0), rotationOffsetRef = useRef(0);

  const forkLevel = activeUpgrades['FORK'] || 0;
  const forkGeo = useMemo(() => {
      const tips = 1 + forkLevel; 
      return createForkedChevronGeo(tips);
  }, [forkLevel]);

  const ambientMaterial = useMemo(() => {
      const mat = MaterialFactory.create('MAT_PLAYER_AMBIENT', { ...ShaderLib.presets.playerAmbient, uniforms: { [Uniforms.COLOR]: { value: new THREE.Color(GAME_THEME.turret.glow) }, [Uniforms.OPACITY]: { value: 0.6 }, [Uniforms.ENERGY]: { value: 0.0 } } });
      mat.blending = THREE.AdditiveBlending; return mat;
  }, []);

  const backingMaterial = useMemo(() => {
      const mat = MaterialFactory.create('MAT_PLAYER_BACKING', { ...ShaderLib.presets.playerBacking, uniforms: { [Uniforms.COLOR]: { value: new THREE.Color(GAME_THEME.turret.glow) }, [Uniforms.OPACITY]: { value: 0.5 } } });
      mat.blending = THREE.NormalBlending; return mat;
  }, []);

  const snifferMaterial = useMemo(() => {
      return new THREE.ShaderMaterial({
          vertexShader: SnifferOverlayShader.vertex,
          fragmentShader: SnifferOverlayShader.fragment,
          uniforms: {
              uLevel: { value: 0 },
              uColor: { value: new THREE.Color(0, 0, 0) },
              uTime: { value: 0 }
          },
          transparent: true,
          blending: THREE.NormalBlending,
          depthTest: false
      });
  }, []);

  useEffect(() => {
      const u1 = events.subscribe(GameEvents.PLAYER_HIT, () => { hitFlash.current = 1.0; });
      const u2 = events.subscribe(GameEvents.PLAYER_FIRED, (p) => { lastFireTimeRef.current = performance.now()/1000; targetAimAngle.current = p.angle - Math.PI/2; });
      return () => { u1(); u2(); };
  }, [events]);

  useFrame((state, delta) => {
    if (!containerRef.current || !centerDotRef.current) return;
    const isSysFail = useGameStore.getState().systemIntegrity <= 0;
    if (!isZenMode) zenStartTime.current = -1; else if (zenStartTime.current === -1) zenStartTime.current = state.clock.elapsedTime;

    let targetScale = (introDone && (isZenMode ? (zenStartTime.current !== -1 && state.clock.elapsedTime > zenStartTime.current + 1.5) : !isSysFail)) ? 1 : 0;
    animScale.current = THREE.MathUtils.lerp(animScale.current, targetScale, delta * 2.0);
    if (animScale.current < 0.01) { containerRef.current.visible = false; return; }
    containerRef.current.visible = true;

    if (hitFlash.current > 0) hitFlash.current = Math.max(0, hitFlash.current - delta * 4.0);
    const iState = getSystem<IInteractionSystem>('InteractionSystem')?.repairState || 'IDLE';
    const isActive = iState === 'HEALING' || iState === 'REBOOTING' || isZenMode;
    currentEnergy.current = THREE.MathUtils.lerp(currentEnergy.current, isActive ? 1.0 : 0.0, delta * (isActive ? 12.0 : 3.0));
    if (ambientMaterial.uniforms[Uniforms.ENERGY]) ambientMaterial.uniforms[Uniforms.ENERGY].value = Math.min(1.0, currentEnergy.current + hitFlash.current);

    let playerEntity; for(const p of registry.getByTag(Tag.PLAYER)) { playerEntity = p; break; }
    if (!playerEntity) return;
    const transform = playerEntity.getComponent<TransformData>(ComponentType.Transform), renderTrans = playerEntity.getComponent<RenderTransform>(ComponentType.RenderTransform);
    const isPlayerDead = useGameStore.getState().playerHealth <= 0, isDeadState = (isPlayerDead || isSysFail) && !isZenMode;
    if (transform) containerRef.current.position.set(transform.x, transform.y, 0);

    if (renderTrans && reticleRef.current && centerDotRef.current && ambientGlowRef.current) {
        const time = state.clock.elapsedTime, tFire = time - lastFireTimeRef.current, iSpd = Math.PI*0.2;
        
        const isFiring = tFire < 0.05; 
        const lerpFactor = isFiring ? 1.0 : 0.4;
        
        if (tFire < 0.25) {
            centerDotRef.current.rotation.z = THREE.MathUtils.lerp(centerDotRef.current.rotation.z, targetAimAngle.current, lerpFactor);
            rotationOffsetRef.current = centerDotRef.current.rotation.z + (time * iSpd);
        } else {
            centerDotRef.current.rotation.z = THREE.MathUtils.lerp(centerDotRef.current.rotation.z, -time * iSpd + rotationOffsetRef.current, 0.08);
        }

        centerDotRef.current.scale.setScalar(1.0 + Math.sin(time * Math.PI) * 0.075);
        reticleRef.current.rotation.z = (isDeadState && iState !== 'REBOOTING') ? Math.PI*0.25 : -renderTrans.rotation;
        
        if (snifferRef.current) {
            snifferRef.current.rotation.z = reticleRef.current.rotation.z;
            const levels = useGameStore.getState().activeUpgrades;
            snifferMaterial.uniforms.uLevel.value = levels['SNIFFER'] || 0;
            snifferMaterial.uniforms.uTime.value = time;
            snifferColor.current.copy(tempColor.current);
            const hsl = { h: 0, s: 0, l: 0 };
            snifferColor.current.getHSL(hsl);
            snifferColor.current.setHSL((hsl.h + 0.5) % 1.0, 1.0, 0.6); 
            snifferMaterial.uniforms.uColor.value.copy(snifferColor.current);
        }

        // --- UPDATE FORK ROTATION ---
        if (forkRef.current) {
            // FIXED: Sync rotation exactly with centerDot (both are defined 'Up' facing)
            forkRef.current.rotation.z = centerDotRef.current.rotation.z;
            (forkRef.current.material as THREE.MeshBasicMaterial).color.copy(tempColor.current);
        }

        if (isZenMode) {
            tempColor.current.setHSL((time*0.1)%1, 1, 0.9); reticleColor.current.setHSL((time*0.1-0.1)%1, 0.9, 0.6);
            backingMaterial.uniforms[Uniforms.COLOR].value.setHSL((time*0.1-0.2)%1, 0.8, 0.5);
            ambientMaterial.uniforms[Uniforms.COLOR].value.setHSL((time*0.1-0.3)%1, 0.8, 0.4);
        } else {
            let target = isDeadState ? COL_DEAD : (iState === 'HEALING' ? COL_REPAIR : (iState === 'REBOOTING' ? COL_REBOOT : COL_BASE));
            tempColor.current.lerp(target, 0.2);
            if (isDeadState) reticleColor.current.lerp(new THREE.Color('#76000C'), 0.2);
            else if (iState === 'HEALING') reticleColor.current.lerp(COL_RET_HEAL, 0.1);
            else reticleColor.current.lerp(tempColor.current, 0.2);
            if (hitFlash.current > 0.01) { tempColor.current.lerp(COL_HIT, hitFlash.current); reticleColor.current.lerp(COL_HIT, hitFlash.current); }
            ambientMaterial.uniforms[Uniforms.COLOR].value.copy(tempColor.current);
            backingMaterial.uniforms[Uniforms.COLOR].value.copy(tempColor.current);
        }
        (reticleRef.current.material as THREE.MeshBasicMaterial).color.copy(reticleColor.current);
        (centerDotRef.current.material as THREE.MeshBasicMaterial).color.copy(tempColor.current);
        containerRef.current.scale.setScalar(renderTrans.scale * animScale.current * (isZenMode ? 3.0 : 1.0));
        (centerDotRef.current.material as THREE.MeshBasicMaterial).wireframe = isDeadState; 
    }
  });

  return (
    <group ref={containerRef}>
      <mesh ref={centerDotRef} geometry={coreGeo} renderOrder={3}><meshBasicMaterial color={GAME_THEME.turret.base} /></mesh>
      <mesh ref={reticleRef} geometry={reticleGeo} rotation={[0,0,Math.PI/12]} renderOrder={2}><meshBasicMaterial color={GAME_THEME.turret.base} transparent opacity={0.8} /></mesh>
      <mesh ref={snifferRef} geometry={reticleGeo} rotation={[0,0,Math.PI/12]} renderOrder={4} material={snifferMaterial} />
      
      <mesh ref={forkRef} geometry={forkGeo} renderOrder={3}>
          <meshBasicMaterial color={GAME_THEME.turret.base} toneMapped={false} />
      </mesh>

      <mesh material={backingMaterial} geometry={glowPlaneGeo} scale={[1.3,1.3,1]} renderOrder={1} />
      <mesh ref={ambientGlowRef} material={ambientMaterial} geometry={glowPlaneGeo} scale={[6,6,1]} renderOrder={0} />
    </group>
  );
};
