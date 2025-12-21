import { useRef, useMemo, useEffect } from 'react';
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
import * as THREE from 'three';

const createCurvedTriangleGeo = () => {
    const shape = new THREE.Shape();
    const R = 0.11; const curveR = 0.10;  
    const p1 = [0, R];
    const p2 = [R * Math.cos(Math.PI * 7/6), R * Math.sin(Math.PI * 7/6)];
    const p3 = [R * Math.cos(Math.PI * 11/6), R * Math.sin(Math.PI * 11/6)];
    const cp12 = [curveR * Math.cos(Math.PI * 150/180), curveR * Math.sin(Math.PI * 150/180)];
    const cp23 = [curveR * Math.cos(Math.PI * 270/180), curveR * Math.sin(Math.PI * 270/180)];
    const cp31 = [curveR * Math.cos(Math.PI * 30/180), curveR * Math.sin(Math.PI * 30/180)];
    shape.moveTo(p1[0], p1[1]);
    shape.quadraticCurveTo(cp12[0], cp12[1], p2[0], p2[1]);
    shape.quadraticCurveTo(cp23[0], cp23[1], p3[0], p3[1]);
    shape.quadraticCurveTo(cp31[0], cp31[1], p1[0], p1[1]);
    return new THREE.ShapeGeometry(shape);
};

const coreGeo = createCurvedTriangleGeo();
const glowPlaneGeo = new THREE.PlaneGeometry(1, 1);

const createStarRingGeo = () => {
    const points = 4;
    const outerRadius = 0.65;
    const innerRadius = 0.35;
    const indentFactor = 0.60; 
    const twistAngle = 0.55; 
    const shape = new THREE.Shape();
    const step = (Math.PI * 2) / points;
    const halfStep = step / 2;
    for (let i = 0; i < points; i++) {
        const theta = i * step;
        const tipA = theta - twistAngle;
        if (i === 0) shape.moveTo(Math.cos(tipA) * outerRadius, Math.sin(tipA) * outerRadius);
        else shape.lineTo(Math.cos(tipA) * outerRadius, Math.sin(tipA) * outerRadius);
        const rValley = outerRadius * (1.0 - indentFactor);
        shape.lineTo(Math.cos(theta + halfStep) * rValley, Math.sin(theta + halfStep) * rValley);
    }
    const hole = new THREE.Path();
    for (let i = 0; i < points; i++) {
        const theta = i * step;
        const tipA = theta - (twistAngle * 0.5);
        if (i === 0) hole.moveTo(Math.cos(tipA) * innerRadius, Math.sin(tipA) * innerRadius);
        else hole.lineTo(Math.cos(tipA) * innerRadius, Math.sin(tipA) * innerRadius);
        const rValley = innerRadius * (1.0 - indentFactor);
        hole.lineTo(Math.cos(theta + halfStep) * rValley, Math.sin(theta + halfStep) * rValley);
    }
    shape.holes.push(hole);
    return new THREE.ShapeGeometry(shape);
};
const reticleGeo = createStarRingGeo();

const COL_BASE = new THREE.Color(GAME_THEME.turret.base);
const COL_REPAIR = new THREE.Color(GAME_THEME.turret.repair);
const COL_REBOOT = new THREE.Color('#9E4EA5');
const COL_DEAD = new THREE.Color('#FF003C');
const COL_HIT = new THREE.Color('#FF003C'); 
const COL_RETICLE_HEAL = new THREE.Color('#257171');

export const PlayerActor = () => {
  const { registry, getSystem, events } = useGameContext();
  const containerRef = useRef<THREE.Group>(null);
  const centerDotRef = useRef<THREE.Mesh>(null);
  const reticleRef = useRef<THREE.Mesh>(null);
  const backingCircleRef = useRef<THREE.Mesh>(null);
  const ambientGlowRef = useRef<THREE.Mesh>(null);
  
  const { introDone } = useStore(); 
  const isZenMode = useGameStore(state => state.isZenMode);

  const animScale = useRef(0);
  const tempColor = useRef(new THREE.Color(GAME_THEME.turret.base));
  const reticleColor = useRef(new THREE.Color(GAME_THEME.turret.base));
  const currentEnergy = useRef(0.0);
  const hitFlash = useRef(0.0); 
  const zenStartTime = useRef(-1);

  // --- AIM STATE ---
  const lastFireTimeRef = useRef(-100);
  const targetAimAngle = useRef(0);
  const rotationOffsetRef = useRef(0);

  const ambientMaterial = useMemo(() => {
      const mat = MaterialFactory.create('MAT_PLAYER_AMBIENT', {
          ...ShaderLib.presets.playerAmbient,
          uniforms: { 
              [Uniforms.COLOR]: { value: new THREE.Color(GAME_THEME.turret.glow) }, 
              [Uniforms.OPACITY]: { value: 0.6 }, 
              [Uniforms.ENERGY]: { value: 0.0 } 
          }
      });
      mat.blending = THREE.AdditiveBlending;
      return mat;
  }, []);

  const backingMaterial = useMemo(() => {
      const mat = MaterialFactory.create('MAT_PLAYER_BACKING', {
          ...ShaderLib.presets.playerBacking,
          uniforms: { 
              [Uniforms.COLOR]: { value: new THREE.Color(GAME_THEME.turret.glow) }, 
              [Uniforms.OPACITY]: { value: 0.5 } 
          }
      });
      mat.blending = THREE.NormalBlending;
      return mat;
  }, []);

  useEffect(() => {
      const u1 = events.subscribe(GameEvents.PLAYER_HIT, () => { hitFlash.current = 1.0; });
      const u2 = events.subscribe(GameEvents.PLAYER_FIRED, (p) => { 
          lastFireTimeRef.current = performance.now() / 1000;
          // Compensate for 3D coordinate system (Top point of triangle is Y+ which is PI/2)
          targetAimAngle.current = p.angle - Math.PI/2; 
      });
      return () => { u1(); u2(); };
  }, [events]);

  useFrame((state, delta) => {
    if (!containerRef.current || !centerDotRef.current) return;
    const isSystemFailure = useGameStore.getState().systemIntegrity <= 0;
    
    if (!isZenMode) zenStartTime.current = -1;
    else if (zenStartTime.current === -1) zenStartTime.current = state.clock.elapsedTime;

    let targetScale = 0;
    if (introDone) {
        if (isZenMode) {
            if (zenStartTime.current !== -1 && state.clock.elapsedTime > zenStartTime.current + 1.5) targetScale = 1;
        } else if (!isSystemFailure) targetScale = 1;
    }

    animScale.current = THREE.MathUtils.lerp(animScale.current, targetScale, delta * 2.0);
    if (animScale.current < 0.01) { containerRef.current.visible = false; return; }
    containerRef.current.visible = true;

    if (hitFlash.current > 0) hitFlash.current = Math.max(0, hitFlash.current - delta * 4.0);

    let interactState = 'IDLE';
    const interact = getSystem<IInteractionSystem>('InteractionSystem');
    if (interact) interactState = interact.repairState;

    const isActive = (interactState === 'HEALING' || interactState === 'REBOOTING') || isZenMode;
    currentEnergy.current = THREE.MathUtils.lerp(currentEnergy.current, isActive ? 1.0 : 0.0, delta * (isActive ? 12.0 : 3.0));
    
    if (ambientMaterial.uniforms[Uniforms.ENERGY]) {
        ambientMaterial.uniforms[Uniforms.ENERGY].value = Math.min(1.0, currentEnergy.current + hitFlash.current);
    }

    let playerEntity;
    for(const p of registry.getByTag(Tag.PLAYER)) { playerEntity = p; break; }
    if (!playerEntity) return;

    const transform = playerEntity.getComponent<TransformData>(ComponentType.Transform);
    const renderTrans = playerEntity.getComponent<RenderTransform>(ComponentType.RenderTransform);
    const isPlayerDead = useGameStore.getState().playerHealth <= 0; 
    const isDeadState = (isPlayerDead || isSystemFailure) && !isZenMode;

    if (transform) containerRef.current.position.set(transform.x, transform.y, 0);

    if (renderTrans && reticleRef.current && centerDotRef.current && ambientGlowRef.current) {
        const time = state.clock.elapsedTime;

        // --- CORE ROTATION ENGINE ---
        const timeSinceFire = time - lastFireTimeRef.current;
        const idleSpeed = (Math.PI * 2 / 10);
        
        centerDotRef.current.geometry = coreGeo;

        if (timeSinceFire < 0.25) {
            // LOCK ON TARGET
            centerDotRef.current.rotation.z = THREE.MathUtils.lerp(centerDotRef.current.rotation.z, targetAimAngle.current, 0.4);
            // Anchor the offset for a smooth resume
            rotationOffsetRef.current = centerDotRef.current.rotation.z + (time * idleSpeed);
        } else {
            // EASE BACK TO IDLE
            const targetIdle = -time * idleSpeed + rotationOffsetRef.current;
            centerDotRef.current.rotation.z = THREE.MathUtils.lerp(centerDotRef.current.rotation.z, targetIdle, 0.08);
        }

        const pulse = 1.0 + Math.sin(time * Math.PI) * 0.075;
        centerDotRef.current.scale.setScalar(pulse);

        if (isDeadState && interactState !== 'REBOOTING') reticleRef.current.rotation.z = Math.PI * 0.25;
        else reticleRef.current.rotation.z = -renderTrans.rotation;
        
        if (isZenMode) {
            tempColor.current.setHSL((time * 0.1) % 1, 1.0, 0.9);
            reticleColor.current.setHSL((time * 0.1 - 0.1) % 1, 0.9, 0.6);
            backingMaterial.uniforms[Uniforms.COLOR].value.setHSL((time * 0.1 - 0.2) % 1, 0.8, 0.5);
            ambientMaterial.uniforms[Uniforms.COLOR].value.setHSL((time * 0.1 - 0.3) % 1, 0.8, 0.4);
        } else {
            let targetColor = isDeadState ? COL_DEAD : (interactState === 'HEALING' ? COL_REPAIR : (interactState === 'REBOOTING' ? COL_REBOOT : COL_BASE));
            tempColor.current.lerp(targetColor, 0.2);
            if (isDeadState) reticleColor.current.lerp(new THREE.Color('#76000C'), 0.2);
            else if (interactState === 'HEALING') reticleColor.current.lerp(COL_RETICLE_HEAL, 0.1);
            else reticleColor.current.lerp(tempColor.current, 0.2);
            
            if (hitFlash.current > 0.01) { 
                tempColor.current.lerp(COL_HIT, hitFlash.current);
                reticleColor.current.lerp(COL_HIT, hitFlash.current); 
            }
            ambientMaterial.uniforms[Uniforms.COLOR].value.copy(tempColor.current);
            backingMaterial.uniforms[Uniforms.COLOR].value.copy(tempColor.current);
        }

        (reticleRef.current.material as THREE.MeshBasicMaterial).color.copy(reticleColor.current);
        (centerDotRef.current.material as THREE.MeshBasicMaterial).color.copy(tempColor.current);
        
        const zenScale = isZenMode ? 3.0 : 1.0;
        containerRef.current.scale.setScalar(renderTrans.scale * animScale.current * zenScale);
        (centerDotRef.current.material as THREE.MeshBasicMaterial).wireframe = isDeadState; 
    }
  });

  return (
    <group ref={containerRef}>
      <mesh ref={centerDotRef} renderOrder={3}><meshBasicMaterial color={GAME_THEME.turret.base} /></mesh>
      <mesh ref={reticleRef} geometry={reticleGeo} rotation={[0, 0, Math.PI / 12]} renderOrder={2}><meshBasicMaterial color={GAME_THEME.turret.base} transparent opacity={0.8} /></mesh>
      <mesh ref={backingCircleRef} material={backingMaterial} geometry={glowPlaneGeo} scale={[1.3, 1.3, 1]} renderOrder={1} />
      <mesh ref={ambientGlowRef} material={ambientMaterial} geometry={glowPlaneGeo} scale={[6, 6, 1]} renderOrder={0} />
    </group>
  );
};
