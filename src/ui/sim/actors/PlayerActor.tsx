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
const reticleGeo = new THREE.RingGeometry(0.4, 0.45, 4); 
const glowPlaneGeo = new THREE.PlaneGeometry(1, 1);

// --- SHADER (Tech Glow) ---
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
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5);
      vec2 pos = vUv - center;
      
      // 1. Angular Warble (Subtle distortion)
      float angle = atan(pos.y, pos.x);
      float warble = 0.005 * sin(angle * 10.0 + uTime * 2.0);
      float dist = length(pos) + warble;
      
      // 2. Base Glow (Sharp Falloff)
      float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
      alpha = pow(alpha, 3.5); 
      
      // 3. Concentric Rings (Darker bands)
      // Generates expanding/contracting rings based on distance and time
      float rings = 0.7 + 0.3 * sin(dist * 80.0 - uTime * 1.0);
      
      // 4. Scanlines (Vertical interference)
      float scan = 0.85 + 0.15 * sin(vUv.y * 150.0 + uTime * 5.0);
      
      // Combine textures
      // We multiply the alpha by rings/scan to "cut out" the dark parts
      float finalAlpha = alpha * rings * scan * uOpacity;
      
      // Reduce hard clipping at edges
      if (finalAlpha < 0.01) discard;

      gl_FragColor = vec4(uColor, finalAlpha);
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

  // Memoize shader material
  const glowMaterial = useMemo(() => new THREE.ShaderMaterial({
      vertexShader: glowShader.vertex,
      fragmentShader: glowShader.fragment,
      uniforms: {
          uColor: { value: new THREE.Color(GAME_THEME.turret.glow) },
          uOpacity: { value: 0.6 },
          uTime: { value: 0.0 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
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

    // --- SHADER UPDATE ---
    glowMaterial.uniforms.uTime.value = state.clock.elapsedTime;

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
        
        glowMaterial.uniforms.uColor.value.copy(tempColor.current);

        const scale = render.visualScale * animScale.current;
        containerRef.current.scale.setScalar(scale);

        if (isDead) {
            reticleRef.current.visible = false;
            ambientGlowRef.current.visible = false;
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
      <mesh ref={centerDotRef} renderOrder={2}>
        <bufferGeometry />
        <meshBasicMaterial color={GAME_THEME.turret.base} />
      </mesh>

      <mesh ref={reticleRef} geometry={reticleGeo} rotation={[0, 0, Math.PI / 4]} renderOrder={1}>
        <meshBasicMaterial color={GAME_THEME.turret.base} transparent opacity={0.8} />
      </mesh>

      <mesh ref={ambientGlowRef} material={glowMaterial} geometry={glowPlaneGeo} scale={[6, 6, 1]} renderOrder={0} />
    </group>
  );
};
