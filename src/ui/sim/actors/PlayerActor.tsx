import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { GAME_THEME } from '@/ui/sim/config/theme';
import { ServiceLocator } from '@/sys/services/ServiceLocator';
import { Tag } from '@/engine/ecs/types';
import { TransformData } from '@/sys/data/TransformData';
import { RenderData } from '@/sys/data/RenderData';
import { useStore } from '@/sys/state/global/useStore';
import { useGameStore } from '@/sys/state/game/useGameStore';
import { ComponentType } from '@/engine/ecs/ComponentType';
import * as THREE from 'three';

// --- GEOMETRY GENERATION ---
const centerGeo = new THREE.CircleGeometry(0.1, 16);
const deadGeo = new THREE.CircleGeometry(0.12, 3); 
const glowPlaneGeo = new THREE.PlaneGeometry(1, 1);

// Helper to generate the Star-Ring (6 points, pulled in valleys)
const createStarRingGeo = () => {
    const points = 6;
    const outerRadius = 0.50;
    const innerRadius = 0.30;
    
    // SHARPENING: How much to pull the valleys in.
    const indentFactor = 0.60; 

    const shape = new THREE.Shape();
    const step = (Math.PI * 2) / points;
    const halfStep = step / 2;

    // 1. Define Outer Star
    for (let i = 0; i < points; i++) {
        const theta = i * step;
        
        // Tip (The original points)
        if (i === 0) shape.moveTo(Math.cos(theta) * outerRadius, Math.sin(theta) * outerRadius);
        else shape.lineTo(Math.cos(theta) * outerRadius, Math.sin(theta) * outerRadius);
        
        // Valley (The pulled-in midpoint)
        const midTheta = theta + halfStep;
        const rValley = outerRadius * (1.0 - indentFactor);
        shape.lineTo(Math.cos(midTheta) * rValley, Math.sin(midTheta) * rValley);
    }

    // 2. Define Inner Hole (Matching star shape to keep width consistent)
    const hole = new THREE.Path();
    for (let i = 0; i < points; i++) {
        const theta = i * step;
        
        // Tip
        if (i === 0) hole.moveTo(Math.cos(theta) * innerRadius, Math.sin(theta) * innerRadius);
        else hole.lineTo(Math.cos(theta) * innerRadius, Math.sin(theta) * innerRadius);
        
        // Valley
        const midTheta = theta + halfStep;
        const rValley = innerRadius * (1.0 - indentFactor);
        hole.lineTo(Math.cos(midTheta) * rValley, Math.sin(midTheta) * rValley);
    }
    
    shape.holes.push(hole);
    return new THREE.ShapeGeometry(shape);
};

const reticleGeo = createStarRingGeo();

// --- SHADER: COMPLEX TECH GLOW (Ambient Layer) ---
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
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5);
      vec2 pos = vUv - center;
      
      float angle = atan(pos.y, pos.x);
      float warble = 0.005 * sin(angle * 10.0 + uTime * 2.0);
      float dist = length(pos) + warble;
      
      float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
      alpha = pow(alpha, 3.5); 
      
      // Structure Rings (Slow, thick bands)
      float rings = 0.7 + 0.3 * sin(dist * 80.0 - uTime * 1.0);
      
      // Radial Scanlines (Fast, thin concentric ripples)
      float scan = 0.85 + 0.15 * sin(dist * 150.0 - uTime * 5.0);
      
      float finalAlpha = alpha * rings * scan * uOpacity;
      if (finalAlpha < 0.01) discard;

      gl_FragColor = vec4(uColor, finalAlpha);
    }
  `
};

// --- SHADER: SIMPLE SOFT CIRCLE (Backing Layer) ---
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
      // Softer Edge
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

  const ambientMaterial = useMemo(() => new THREE.ShaderMaterial({
      vertexShader: techGlowShader.vertex,
      fragmentShader: techGlowShader.fragment,
      uniforms: {
          uColor: { value: new THREE.Color(GAME_THEME.turret.glow) },
          uOpacity: { value: 0.6 },
          uTime: { value: 0.0 }
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

    ambientMaterial.uniforms.uTime.value = state.clock.elapsedTime;

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

      {/* Spinning Star-Reticle */}
      <mesh ref={reticleRef} geometry={reticleGeo} rotation={[0, 0, Math.PI / 12]} renderOrder={2}>
        <meshBasicMaterial color={GAME_THEME.turret.base} transparent opacity={0.8} />
      </mesh>

      <mesh ref={backingCircleRef} material={backingMaterial} geometry={glowPlaneGeo} scale={[1.3, 1.3, 1]} renderOrder={1} />

      <mesh ref={ambientGlowRef} material={ambientMaterial} geometry={glowPlaneGeo} scale={[6, 6, 1]} renderOrder={0} />
    </group>
  );
};
