import { useRef, useMemo } from 'react';
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
import * as THREE from 'three';

// --- GEOMETRY GENERATION ---
const centerGeo = new THREE.CircleGeometry(0.1, 16);
const deadGeo = new THREE.CircleGeometry(0.12, 3); 
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
        const midTheta = theta + halfStep;
        const rValley = outerRadius * (1.0 - indentFactor);
        shape.lineTo(Math.cos(midTheta) * rValley, Math.sin(midTheta) * rValley);
    }

    const hole = new THREE.Path();
    for (let i = 0; i < points; i++) {
        const theta = i * step;
        const tipA = theta - (twistAngle * 0.5);
        if (i === 0) hole.moveTo(Math.cos(tipA) * innerRadius, Math.sin(tipA) * innerRadius);
        else hole.lineTo(Math.cos(tipA) * innerRadius, Math.sin(tipA) * innerRadius);
        const midTheta = theta + halfStep;
        const rValley = innerRadius * (1.0 - indentFactor);
        hole.lineTo(Math.cos(midTheta) * rValley, Math.sin(midTheta) * rValley);
    }
    
    shape.holes.push(hole);
    return new THREE.ShapeGeometry(shape);
};

const reticleGeo = createStarRingGeo();

// --- SHADER: CROSS-FADE TECH GLOW ---
const techGlowShader = {
  vertex: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: `
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uTime;
    uniform float uEnergy; // 0.0 (Idle) -> 1.0 (Active) acts as Cross-Fade Mix
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5);
      vec2 pos = vUv - center;
      
      float angle = atan(pos.y, pos.x);
      
      // Warble increases with Energy
      float warble = (0.005 + 0.015 * uEnergy) * sin(angle * 10.0 + uTime * 2.0);
      float dist = length(pos) + warble;
      
      // Base Shape (Circle Fade)
      float alphaBase = 1.0 - smoothstep(0.0, 0.5, dist);
      alphaBase = pow(alphaBase, 3.5); 
      
      // --- PATTERN A: IDLE (Tight, Slow) ---
      float ringsIdle = 0.6 + 0.4 * sin(dist * 80.0 - uTime * 1.5);
      
      // --- PATTERN B: ACTIVE (Wide, Fast, Aggressive) ---
      float ringsActive = 0.5 + 0.5 * sin(dist * 30.0 - uTime * 8.0);
      
      // Cross-Fade between patterns
      float ringMix = mix(ringsIdle, ringsActive, uEnergy);
      
      // Scanlines (Static texture)
      float scan = 0.85 + 0.15 * sin(dist * 150.0 - uTime * 5.0);
      
      // Boost Brightness heavily during Active state
      float brightness = 1.0 + (uEnergy * 2.5);

      float finalAlpha = alphaBase * ringMix * scan * uOpacity * brightness;

      if (finalAlpha < 0.01) discard;

      gl_FragColor = vec4(uColor, finalAlpha);
    }
  `
};

// --- SHADER: SIMPLE SOFT CIRCLE (Backing) ---
const softCircleShader = {
  vertex: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying vec2 vUv;
    void main() {
      float dist = distance(vUv, vec2(0.5));
      float alpha = 1.0 - smoothstep(0.25, 0.5, dist); 
      if (alpha < 0.01) discard;
      gl_FragColor = vec4(uColor, alpha * uOpacity);
    }
  `
};

export const PlayerActor = () => {
  const containerRef = useRef<THREE.Group>(null);
  const centerDotRef = useRef<THREE.Mesh>(null);
  const reticleRef = useRef<THREE.Mesh>(null);
  const backingCircleRef = useRef<THREE.Mesh>(null);
  const ambientGlowRef = useRef<THREE.Mesh>(null);
  
  const { introDone } = useStore(); 
  const animScale = useRef(0);
  const tempColor = useRef(new THREE.Color());
  const currentEnergy = useRef(0.0);

  const ambientMaterial = useMemo(() => new THREE.ShaderMaterial({
      vertexShader: techGlowShader.vertex,
      fragmentShader: techGlowShader.fragment,
      uniforms: {
          uColor: { value: new THREE.Color(GAME_THEME.turret.glow) },
          uOpacity: { value: 0.6 },
          uTime: { value: 0.0 },
          uEnergy: { value: 0.0 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
  }), []);

  const backingMaterial = useMemo(() => new THREE.ShaderMaterial({
      vertexShader: softCircleShader.vertex,
      fragmentShader: softCircleShader.fragment,
      uniforms: {
          uColor: { value: new THREE.Color(GAME_THEME.turret.glow) },
          uOpacity: { value: 0.5 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending 
  }), []);

  useFrame((state, delta) => {
    if (!containerRef.current) return;

    const targetScale = introDone ? 1 : 0;
    animScale.current = THREE.MathUtils.lerp(animScale.current, targetScale, delta * 2.0);
    
    if (animScale.current < 0.01) {
        containerRef.current.visible = false;
        return;
    }
    containerRef.current.visible = true;

    // --- INTERACTION LOGIC ---
    let interactState = 'IDLE';
    try {
        const interact = ServiceLocator.getSystem<IInteractionSystem>('InteractionSystem');
        if (interact) interactState = interact.repairState;
    } catch {}

    const isActive = (interactState === 'HEALING' || interactState === 'REBOOTING');
    const targetEnergy = isActive ? 1.0 : 0.0;
    
    // UPDATED: Asymmetric Fade
    // Fade IN: Fast (12.0)
    // Fade OUT: Gentle (3.0)
    const lerpSpeed = isActive ? 12.0 : 3.0;
    currentEnergy.current = THREE.MathUtils.lerp(currentEnergy.current, targetEnergy, delta * lerpSpeed);

    ambientMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    ambientMaterial.uniforms.uEnergy.value = currentEnergy.current;

    // --- ECS SYNC ---
    let playerEntity;
    try {
        const registry = ServiceLocator.getRegistry();
        const players = registry.getByTag(Tag.PLAYER);
        for(const p of players) { playerEntity = p; break; }
    } catch { return; }

    if (!playerEntity) return;

    const transform = playerEntity.getComponent<TransformData>(ComponentType.Transform);
    const render = playerEntity.getComponent<RenderData>(ComponentType.Render);
    const isDead = useGameStore.getState().playerHealth <= 0; 

    if (transform) {
        containerRef.current.position.set(transform.x, transform.y, 0);
    }

    if (render && reticleRef.current && centerDotRef.current && ambientGlowRef.current) {
        reticleRef.current.rotation.z = -render.visualRotation;
        
        tempColor.current.setRGB(render.r, render.g, render.b);
        
        (reticleRef.current.material as THREE.MeshBasicMaterial).color.copy(tempColor.current);
        (centerDotRef.current.material as THREE.MeshBasicMaterial).color.copy(tempColor.current);
        
        ambientMaterial.uniforms.uColor.value.copy(tempColor.current);
        backingMaterial.uniforms.uColor.value.copy(tempColor.current);

        const scale = render.visualScale * animScale.current;
        containerRef.current.scale.setScalar(scale);

        if (isDead) {
            reticleRef.current.visible = false;
            ambientGlowRef.current.visible = false;
            backingCircleRef.current!.visible = false;
            
            centerDotRef.current.geometry = deadGeo;
            (centerDotRef.current.material as THREE.MeshBasicMaterial).wireframe = true; 
            centerDotRef.current.rotation.z = -render.visualRotation; 
        } else {
            reticleRef.current.visible = true;
            ambientGlowRef.current.visible = true;
            backingCircleRef.current!.visible = true;
            
            centerDotRef.current.geometry = centerGeo;
            (centerDotRef.current.material as THREE.MeshBasicMaterial).wireframe = false;
        }
    }
  });

  return (
    <group ref={containerRef}>
      <mesh ref={centerDotRef} renderOrder={3}>
        <bufferGeometry />
        <meshBasicMaterial color={GAME_THEME.turret.base} />
      </mesh>

      {/* Spinning Buzz-Saw Reticle */}
      <mesh ref={reticleRef} geometry={reticleGeo} rotation={[0, 0, Math.PI / 12]} renderOrder={2}>
        <meshBasicMaterial color={GAME_THEME.turret.base} transparent opacity={0.8} />
      </mesh>

      <mesh ref={backingCircleRef} material={backingMaterial} geometry={glowPlaneGeo} scale={[1.3, 1.3, 1]} renderOrder={1} />

      <mesh ref={ambientGlowRef} material={ambientMaterial} geometry={glowPlaneGeo} scale={[6, 6, 1]} renderOrder={0} />
    </group>
  );
};
