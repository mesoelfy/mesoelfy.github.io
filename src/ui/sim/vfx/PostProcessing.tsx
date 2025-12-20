import { useThree, extend, useFrame } from '@react-three/fiber';
import { Effects } from '@react-three/drei';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { RenderPass, UnrealBloomPass, AfterimagePass, ShaderPass } from 'three-stdlib';
import { useStore } from '@/engine/state/global/useStore';
import { Uniforms } from '@/engine/graphics/Uniforms';

extend({ RenderPass, UnrealBloomPass, AfterimagePass, ShaderPass });

const VignetteShader = {
  uniforms: { 
      "tDiffuse": { value: null }, 
      [Uniforms.OFFSET]: { value: 1.0 }, 
      [Uniforms.DARKNESS]: { value: 1.0 } 
  },
  vertexShader: `varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }`,
  fragmentShader: `uniform float offset; uniform float darkness; uniform sampler2D tDiffuse; varying vec2 vUv;
    void main() { 
      vec4 texel = texture2D( tDiffuse, vUv );
      vec2 uv = ( vUv - vec2( 0.5 ) ) * vec2( offset );
      gl_FragColor = vec4( mix( texel.rgb, vec3( 1.0 - darkness ), dot( uv, uv ) ), texel.a ); 
    }`
};

export const EffectsLayer = () => {
  const { graphicsMode } = useStore();
  const { size, scene, camera } = useThree();
  const afterimageRef = useRef<any>(null);
  const bloomRef = useRef<any>(null);
  const resolution = useMemo(() => new THREE.Vector2(size.width, size.height), [size]);

  useEffect(() => { if (bloomRef.current) bloomRef.current.resolution = new THREE.Vector2(size.width, size.height); }, [size]);
  useFrame(() => { if (afterimageRef.current) afterimageRef.current.uniforms[Uniforms.DAMP].value = 0.92; });

  if (graphicsMode === 'POTATO') return null;
  return (
    <Effects disableGamma>
      <renderPass args={[scene, camera]} />
      <afterimagePass ref={afterimageRef} />
      <unrealBloomPass ref={bloomRef} args={[resolution, 1.5, 0.4, 0.2]} strength={1.5} radius={0.4} threshold={0.2} />
      <shaderPass args={[VignetteShader]} uniforms-offset-value={0.9} uniforms-darkness-value={0.6} />
    </Effects>
  );
};
