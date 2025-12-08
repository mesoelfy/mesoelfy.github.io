import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@/core/store/useStore';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uProgress;
  uniform vec2 uResolution;
  varying vec2 vUv;

  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    float noise = snoise(vUv * 3.0 + vec2(0.0, uTime * 0.2));
    
    // Progress Calculation
    // Map uProgress (0..1) to (-1..1) for full coverage
    float prog = (uProgress * 2.5) - 1.0; 
    
    float alpha = smoothstep(prog, prog + 0.2, noise);
    
    // Green Flame Edge
    float edge = 1.0 - smoothstep(prog, prog + 0.05, noise);
    vec3 flameColor = vec3(0.47, 0.96, 0.33); // #78F654
    
    vec3 finalColor = mix(vec3(0.0), flameColor, edge);

    if (alpha <= 0.01) discard; 

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const FireTransition = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { introDone, isBreaching } = useStore();
  const { viewport } = useThree();

  const animState = useRef({ value: 0 });

  useFrame((state, delta) => {
    if (!materialRef.current) return;

    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    // LOGIC: Start burning if Intro Done OR if we are currently breaching
    const target = (introDone || isBreaching) ? 1 : 0;
    
    animState.current.value = THREE.MathUtils.lerp(animState.current.value, target, delta * 1.5);
    materialRef.current.uniforms.uProgress.value = animState.current.value;

    if (meshRef.current) {
        meshRef.current.visible = animState.current.value < 0.99;
    }
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 }, 
      uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
    }),
    [viewport]
  );

  return (
    <mesh ref={meshRef} position={[0, 0, 1]}> 
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthTest={false} 
      />
    </mesh>
  );
};
