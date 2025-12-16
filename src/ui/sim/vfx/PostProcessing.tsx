import { useThree, extend, useFrame } from '@react-three/fiber';
import { Effects } from '@react-three/drei';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { RenderPass } from 'three-stdlib';
import { UnrealBloomPass } from 'three-stdlib';
import { AfterimagePass } from 'three-stdlib';
import { ShaderPass } from 'three-stdlib';
import { useStore } from '@/engine/state/global/useStore';

// Register external passes
extend({ RenderPass, UnrealBloomPass, AfterimagePass, ShaderPass });

// --- VIGNETTE SHADER ---
const VignetteShader = {
  uniforms: {
    "tDiffuse": { value: null },
    "offset": { value: 1.0 },
    "darkness": { value: 1.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: `
    uniform float offset;
    uniform float darkness;
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D( tDiffuse, vUv );
      vec2 uv = ( vUv - vec2( 0.5 ) ) * vec2( offset );
      gl_FragColor = vec4( mix( texel.rgb, vec3( 1.0 - darkness ), dot( uv, uv ) ), texel.a );
    }
  `
};

export const EffectsLayer = () => {
  const { graphicsMode } = useStore();
  const { size, scene, camera } = useThree();
  const afterimageRef = useRef<any>(null);
  const bloomRef = useRef<any>(null);

  const isPotato = graphicsMode === 'POTATO';

  // Screen Resolution for Bloom
  const resolution = useMemo(() => new THREE.Vector2(size.width, size.height), [size]);

  useEffect(() => {
      if (bloomRef.current) {
          bloomRef.current.resolution = new THREE.Vector2(size.width, size.height);
      }
  }, [size]);

  // ANIMATE DAMPENING
  // We can dynamically adjust the "Ghosting" amount.
  // 0.96 = Heavy Trails. 0.8 = Short Trails.
  useFrame(() => {
      if (afterimageRef.current) {
          // If potato mode, disable trails (set damp to 0 effectively)
          // Actually AfterimagePass doesn't support 0 damp well, better to conditional render.
          // But for HIGH mode:
          afterimageRef.current.uniforms["damp"].value = 0.92;
      }
  });

  if (isPotato) return null;

  return (
    <Effects disableGamma>
      {/* 1. Base Scene Render */}
      <renderPass args={[scene, camera]} />

      {/* 2. Phosphor / Afterimage (The Ghost Trail) */}
      <afterimagePass ref={afterimageRef} />

      {/* 3. Bloom (The Neon Glow) */}
      <unrealBloomPass 
        ref={bloomRef}
        args={[resolution, 1.5, 0.4, 0.2]} // strength, radius, threshold
        strength={1.5}
        radius={0.4}
        threshold={0.2}
      />

      {/* 4. Vignette (Focus) */}
      <shaderPass 
        args={[VignetteShader]}
        uniforms-offset-value={0.9}
        uniforms-darkness-value={0.6}
      />
    </Effects>
  );
};
