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

const centerGeo = new THREE.CircleGeometry(0.1, 16);
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
const COL_DEAD_DARK = new THREE.Color('#76000C');
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
  const animScale = useRef(0);
  const tempColor = useRef(new THREE.Color(GAME_THEME.turret.base));
  const reticleColor = useRef(new THREE.Color(GAME_THEME.turret.base));
  const currentEnergy = useRef(0.0);
  const hitFlash = useRef(0.0); 

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

  useEffect(() => events.subscribe(GameEvents.PLAYER_HIT, () => { hitFlash.current = 1.0; }), [events]);

  useFrame((state, delta) => {
    if (!containerRef.current) return;
    const isSystemFailure = useGameStore.getState().systemIntegrity <= 0;
    const isZenMode = useGameStore.getState().isZenMode;
    const targetScale = (introDone && (isZenMode || !isSystemFailure)) ? 1 : 0;
    animScale.current = THREE.MathUtils.lerp(animScale.current, targetScale, delta * 2.0);
    
    if (animScale.current < 0.01) { 
        containerRef.current.visible = false; 
        return; 
    }
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
        if (isDeadState && interactState !== 'REBOOTING') reticleRef.current.rotation.z = Math.PI * 0.25;
        else reticleRef.current.rotation.z = -renderTrans.rotation;
        
        if (isZenMode) {
            const time = state.clock.elapsedTime * 0.1;
            tempColor.current.setHSL(time % 1, 1.0, 0.9);
            reticleColor.current.setHSL((time - 0.1) % 1, 0.9, 0.6);
            backingMaterial.uniforms[Uniforms.COLOR].value.setHSL((time - 0.2) % 1, 0.8, 0.5);
            ambientMaterial.uniforms[Uniforms.COLOR].value.setHSL((time - 0.3) % 1, 0.8, 0.4);
        } else {
            let targetColor = isDeadState ? COL_DEAD : (interactState === 'HEALING' ? COL_REPAIR : (interactState === 'REBOOTING' ? COL_REBOOT : COL_BASE));
            tempColor.current.lerp(targetColor, 0.2);
            if (isDeadState) reticleColor.current.lerp(COL_DEAD_DARK, 0.2);
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
        centerDotRef.current.geometry = centerGeo;
        (centerDotRef.current.material as THREE.MeshBasicMaterial).wireframe = isDeadState; 
    }
  });

  return (
    <group ref={containerRef}>
      <mesh ref={centerDotRef} renderOrder={3}><bufferGeometry /><meshBasicMaterial color={GAME_THEME.turret.base} /></mesh>
      <mesh ref={reticleRef} geometry={reticleGeo} rotation={[0, 0, Math.PI / 12]} renderOrder={2}><meshBasicMaterial color={GAME_THEME.turret.base} transparent opacity={0.8} /></mesh>
      <mesh ref={backingCircleRef} material={backingMaterial} geometry={glowPlaneGeo} scale={[1.3, 1.3, 1]} renderOrder={1} />
      <mesh ref={ambientGlowRef} material={ambientMaterial} geometry={glowPlaneGeo} scale={[6, 6, 1]} renderOrder={0} />
    </group>
  );
};
