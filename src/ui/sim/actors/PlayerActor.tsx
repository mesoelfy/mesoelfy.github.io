import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { GAME_THEME } from '@/ui/sim/config/theme';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { Tag } from '@/engine/ecs/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { RenderData } from '@/engine/ecs/components/RenderData';
import { useStore } from '@/engine/state/global/useStore';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { IInteractionSystem } from '@/engine/interfaces';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
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

const techGlowShader = {
  vertex: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragment: `
    uniform vec3 uColor; uniform float uOpacity; uniform float uTime; uniform float uEnergy;
    varying vec2 vUv;
    void main() {
      vec2 pos = vUv - 0.5;
      float angle = atan(pos.y, pos.x);
      float warble = (0.005 + 0.015 * uEnergy) * sin(angle * 10.0 + uTime * 2.0);
      float dist = length(pos) + warble;
      float alphaBase = pow(1.0 - smoothstep(0.0, 0.5, dist), 3.5);
      float ringsIdle = 0.6 + 0.4 * sin(dist * 80.0 - uTime * 1.5);
      float ringsActive = 0.5 + 0.5 * sin(dist * 30.0 - uTime * 8.0);
      float ringMix = mix(ringsIdle, ringsActive, uEnergy);
      float scan = 0.85 + 0.15 * sin(dist * 150.0 - uTime * 5.0);
      float finalAlpha = alphaBase * ringMix * scan * uOpacity * (1.0 + (uEnergy * 2.5));
      if (finalAlpha < 0.01) discard;
      gl_FragColor = vec4(uColor, finalAlpha);
    }
  `
};

const softCircleShader = {
  vertex: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragment: `uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv; void main() { float dist = distance(vUv, vec2(0.5)); float alpha = 1.0 - smoothstep(0.25, 0.5, dist); if (alpha < 0.01) discard; gl_FragColor = vec4(uColor, alpha * uOpacity); }`
};

const COL_BASE = new THREE.Color(GAME_THEME.turret.base);
const COL_REPAIR = new THREE.Color(GAME_THEME.turret.repair);
const COL_REBOOT = new THREE.Color('#9E4EA5');
const COL_DEAD = new THREE.Color('#FF003C');
const COL_DEAD_DARK = new THREE.Color('#76000C');
const COL_HIT = new THREE.Color('#FF003C'); 
const COL_RETICLE_HEAL = new THREE.Color('#257171');

export const PlayerActor = () => {
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

  const ambientMaterial = useMemo(() => new THREE.ShaderMaterial({
      vertexShader: techGlowShader.vertex, fragmentShader: techGlowShader.fragment,
      uniforms: { uColor: { value: new THREE.Color(GAME_THEME.turret.glow) }, uOpacity: { value: 0.6 }, uTime: { value: 0.0 }, uEnergy: { value: 0.0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  }), []);

  const backingMaterial = useMemo(() => new THREE.ShaderMaterial({
      vertexShader: softCircleShader.vertex, fragmentShader: softCircleShader.fragment,
      uniforms: { uColor: { value: new THREE.Color(GAME_THEME.turret.glow) }, uOpacity: { value: 0.5 } },
      transparent: true, depthWrite: false, blending: THREE.NormalBlending 
  }), []);

  useEffect(() => { return GameEventBus.subscribe(GameEvents.PLAYER_HIT, () => { hitFlash.current = 1.0; }); }, []);

  useFrame((state, delta) => {
    if (!containerRef.current) return;
    const targetScale = introDone ? 1 : 0;
    animScale.current = THREE.MathUtils.lerp(animScale.current, targetScale, delta * 2.0);
    if (animScale.current < 0.01) { containerRef.current.visible = false; return; }
    containerRef.current.visible = true;

    if (hitFlash.current > 0) hitFlash.current = Math.max(0, hitFlash.current - delta * 4.0);

    let interactState = 'IDLE';
    try { const interact = ServiceLocator.getSystem<IInteractionSystem>('InteractionSystem'); if (interact) interactState = interact.repairState; } catch {}
    const isActive = (interactState === 'HEALING' || interactState === 'REBOOTING');
    currentEnergy.current = THREE.MathUtils.lerp(currentEnergy.current, isActive ? 1.0 : 0.0, delta * (isActive ? 12.0 : 3.0));
    ambientMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    ambientMaterial.uniforms.uEnergy.value = Math.min(1.0, currentEnergy.current + hitFlash.current);

    let playerEntity;
    try { const registry = ServiceLocator.getRegistry(); for(const p of registry.getByTag(Tag.PLAYER)) { playerEntity = p; break; } } catch { return; }
    if (!playerEntity) return;

    const transform = playerEntity.getComponent<TransformData>(ComponentType.Transform);
    const render = playerEntity.getComponent<RenderData>(ComponentType.Render);
    const isDead = useGameStore.getState().playerHealth <= 0; 

    if (transform) containerRef.current.position.set(transform.x, transform.y, 0);
    if (render && reticleRef.current && centerDotRef.current && ambientGlowRef.current) {
        if (isDead && interactState !== 'REBOOTING') reticleRef.current.rotation.z = Math.PI * 0.25; 
        else reticleRef.current.rotation.z = -render.visualRotation;
        
        let targetColor = isDead ? COL_DEAD : (interactState === 'HEALING' ? COL_REPAIR : (interactState === 'REBOOTING' ? COL_REBOOT : COL_BASE));
        tempColor.current.lerp(targetColor, 0.2); 
        if (isDead) reticleColor.current.lerp(COL_DEAD_DARK, 0.2);
        else if (interactState === 'HEALING') reticleColor.current.lerp(COL_RETICLE_HEAL, 0.1);
        else reticleColor.current.lerp(tempColor.current, 0.2);

        if (hitFlash.current > 0.01) { tempColor.current.lerp(COL_HIT, hitFlash.current); reticleColor.current.lerp(COL_HIT, hitFlash.current); }
        (reticleRef.current.material as THREE.MeshBasicMaterial).color.copy(reticleColor.current);
        (centerDotRef.current.material as THREE.MeshBasicMaterial).color.copy(tempColor.current);
        ambientMaterial.uniforms.uColor.value.copy(tempColor.current);
        backingMaterial.uniforms.uColor.value.copy(tempColor.current);
        containerRef.current.scale.setScalar(render.visualScale * animScale.current);
        centerDotRef.current.geometry = centerGeo;
        (centerDotRef.current.material as THREE.MeshBasicMaterial).wireframe = isDead; 
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
