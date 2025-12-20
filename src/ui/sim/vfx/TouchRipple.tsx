import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MaterialFactory } from '@/engine/graphics/MaterialFactory';

const RIPPLE_COUNT = 8;

export const TouchRipple = () => {
  const groupRef = useRef<THREE.Group>(null);
  const [ripples, setRipples] = useState<any[]>([]);

  useMemo(() => {
    if (typeof window === 'undefined') return;
    const handleTap = (e: any) => {
      const { x, y } = e.detail;
      setRipples(prev => [
        ...prev.slice(-RIPPLE_COUNT), 
        { x, y, time: 0, id: Math.random() }
      ]);
    };
    window.addEventListener('mobile-spatial-tap', handleTap);
    return () => window.removeEventListener('mobile-spatial-tap', handleTap);
  }, []);

  const rippleMaterial = useMemo(() => {
    return MaterialFactory.create('MAT_TOUCH_RIPPLE', {
      vertex: `
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        uniform float uProgress; 
        
        void main() {
          float d = distance(vUv, vec2(0.5));
          // Expanding ring logic: thickness and expansion
          float ring = smoothstep(uProgress - 0.1, uProgress, d) - smoothstep(uProgress, uProgress + 0.02, d);
          // Fade out as progress increases
          float alpha = ring * (1.0 - uProgress * 2.0);
          
          if (alpha < 0.01) discard;
          
          // Electric Green #78F654
          vec3 color = vec3(0.47, 0.96, 0.33); 
          gl_FragColor = vec4(color * 1.5, alpha);
        }
      `,
      uniforms: {
        uProgress: { value: 0 }
      }
    });
  }, []);

  useFrame((state, delta) => {
    setRipples(prev => prev
      .map(r => ({ ...r, time: r.time + delta * 2.5 }))
      .filter(r => r.time < 0.5)
    );
  });

  return (
    <group ref={groupRef}>
      {ripples.map((r) => (
        <mesh key={r.id} position={[r.x, r.y, 1]} scale={[4, 4, 1]}>
          <planeGeometry />
          <primitive 
            object={rippleMaterial.clone()} 
            attach="material" 
            uniforms-uProgress-value={r.time}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
};
