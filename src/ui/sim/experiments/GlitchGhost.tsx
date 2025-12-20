import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MaterialFactory } from '@/engine/graphics/MaterialFactory';
import { ShaderLib } from '@/engine/graphics/ShaderLib';
import { addBarycentricCoordinates } from '@/engine/math/GeometryUtils';
import { Uniforms } from '@/engine/graphics/Uniforms';

export const GlitchGhost = ({ intensity = 0.5 }: { intensity: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
      const geo = new THREE.IcosahedronGeometry(2, 2);
      return addBarycentricCoordinates(geo);
  }, []);

  const material = useMemo(() => {
      return MaterialFactory.create('MAT_GLITCH', {
          ...ShaderLib.presets.glitch,
          uniforms: {
              [Uniforms.INTENSITY]: { value: 0.0 },
              [Uniforms.FREQUENCY]: { value: 2.0 },
              [Uniforms.SPEED]: { value: 1.0 }
          }
      });
  }, []);

  useFrame((state) => {
      if (!meshRef.current) return;
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      if (material.uniforms[Uniforms.INTENSITY]) {
          material.uniforms[Uniforms.INTENSITY].value = THREE.MathUtils.lerp(
              material.uniforms[Uniforms.INTENSITY].value, 
              intensity, 
              0.1
          );
      }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
};
