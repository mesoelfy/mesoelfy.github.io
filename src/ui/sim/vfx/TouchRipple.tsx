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
          vec2 center = vec2(0.5);
          float d = distance(vUv, center);
          
          // Sharp hollow ring logic
          float radius = uProgress * 0.5;
          float thickness = 0.03 * (1.0 - uProgress); // Gets thinner as it expands
          
          float ring = smoothstep(radius - thickness, radius, d) - smoothstep(radius, radius + 0.01, d);
          
          // Fade out
          float alpha = ring * (1.0 - (uProgress * uProgress));
          
          if (alpha < 0.01) discard;
          
          // Color: Green to White
          vec3 color = mix(vec3(0.47, 0.96, 0.33), vec3(1.0), ring);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      uniforms: {
        uProgress: { value: 0 }
      }
    });
  }, []);

  useFrame((state, delta) => {
    setRipples(prev => prev
      .map(r => ({ ...r, time: r.time + delta * 1.5 })) // Speed 1.5
      .filter(r => r.time < 1.0)
    );
  });

  // renderOrder 100 ensures it draws ON TOP of enemies (renderOrder 0) and floor
  return (
    <group ref={groupRef} renderOrder={100}>
      {ripples.map((r) => (
        <mesh key={r.id} position={[r.x, r.y, 5]} scale={[8, 8, 1]}>
          <planeGeometry />
          <primitive 
            object={rippleMaterial.clone()} 
            attach="material" 
            uniforms-uProgress-value={r.time}
            transparent
            depthTest={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};
