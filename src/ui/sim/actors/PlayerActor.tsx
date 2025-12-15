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

// --- GEOMETRY ---
const centerGeo = new THREE.CircleGeometry(0.1, 16);
const deadGeo = new THREE.CircleGeometry(0.12, 3); 
// 4 segments = Square. Rotated 45deg later to be a diamond/square.
const reticleGeo = new THREE.RingGeometry(0.4, 0.45, 4); 
const glowPlaneGeo = new THREE.PlaneGeometry(1, 1);

// --- SHADER (Procedural Soft Glow) ---
const glowShader = {
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
      // Distance from center (0.5, 0.5)
      float dist = distance(vUv, vec2(0.5));
      
      // Calculate alpha: 1.0 at center, 0.0 at edge (0.5 radius)
      float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
      
      // SHARPER FALLOFF: Increased power from 2.5 to 4.0
      // This makes the glow fade out much faster visually.
      alpha = pow(alpha, 4.0);
      
      gl_FragColor = vec4(uColor, alpha * uOpacity);
    }
  `
};

export const PlayerActor = () => {
  const containerRef = useRef<THREE.Group>(null);
  const centerDotRef = useRef<THREE.Mesh>(null);
  const reticleRef = useRef<THREE.Mesh>(null);
  const ambientGlowRef = useRef<THREE.Mesh>(null);
  
  const { introDone } = useStore(); 
  const animScale = useRef(0);
  const tempColor = useRef(new THREE.Color());

  // Memoize shader material to prevent recompilation
  const glowMaterial = useMemo(() => new THREE.ShaderMaterial({
      vertexShader: glowShader.vertex,
      fragmentShader: glowShader.fragment,
      uniforms: {
          uColor: { value: new THREE.Color(GAME_THEME.turret.glow) },
          uOpacity: { value: 0.6 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending // Adds light to scene
  }), []);

  useFrame((state, delta) => {
    if (!containerRef.current) return;

    // --- INTRO FADE ---
    const targetScale = introDone ? 1 : 0;
    animScale.current = THREE.MathUtils.lerp(animScale.current, targetScale, delta * 2.0);
    
    if (animScale.current < 0.01) {
        containerRef.current.visible = false;
        return;
    }
    containerRef.current.visible = true;

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
        // ROTATION (Positive = Clockwise Visual via negation)
        reticleRef.current.rotation.z = -render.visualRotation;
        
        // COLOR LERP
        tempColor.current.setRGB(render.r, render.g, render.b);
        
        // Apply Color to Meshes
        (reticleRef.current.material as THREE.MeshBasicMaterial).color.copy(tempColor.current);
        (centerDotRef.current.material as THREE.MeshBasicMaterial).color.copy(tempColor.current);
        
        // Apply Color to Glow Shader Uniform
        glowMaterial.uniforms.uColor.value.copy(tempColor.current);

        // SCALE
        const scale = render.visualScale * animScale.current;
        containerRef.current.scale.setScalar(scale);

        // STATE SWAP (Dead vs Alive)
        if (isDead) {
            reticleRef.current.visible = false;
            ambientGlowRef.current.visible = false;
            
            // Swap geometry for death state
            centerDotRef.current.geometry = deadGeo;
            (centerDotRef.current.material as THREE.MeshBasicMaterial).wireframe = true; 
            centerDotRef.current.rotation.z = -render.visualRotation; 
        } else {
            reticleRef.current.visible = true;
            ambientGlowRef.current.visible = true;
            
            centerDotRef.current.geometry = centerGeo;
            (centerDotRef.current.material as THREE.MeshBasicMaterial).wireframe = false;
        }
    }
  });

  return (
    <group ref={containerRef}>
      {/* 1. CENTER DOT (Top Layer) */}
      <mesh ref={centerDotRef} renderOrder={2}>
        <bufferGeometry />
        <meshBasicMaterial color={GAME_THEME.turret.base} />
      </mesh>

      {/* 2. SPINNING RETICLE (Middle Layer) */}
      {/* 4 segments = Square. Rotate 45deg (PI/4) to align as diamond/square */}
      <mesh ref={reticleRef} geometry={reticleGeo} rotation={[0, 0, Math.PI / 4]} renderOrder={1}>
        <meshBasicMaterial color={GAME_THEME.turret.base} transparent opacity={0.8} />
      </mesh>

      {/* 3. PROCEDURAL GLOW (Bottom Layer) */}
      {/* Scaled to 6x for optimal presence without overwhelming the scene */}
      <mesh ref={ambientGlowRef} material={glowMaterial} geometry={glowPlaneGeo} scale={[6, 6, 1]} renderOrder={0} />
    </group>
  );
};
