import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MaterialFactory } from '@/engine/graphics/MaterialFactory';
import { ShaderLib } from '@/engine/graphics/ShaderLib';
import { addBarycentricCoordinates } from '@/engine/math/GeometryUtils';

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
              uIntensity: { value: 0.0 },
              uFrequency: { value: 2.0 },
              uSpeed: { value: 1.0 }
          }
      });
  }, []);

  useFrame((state) => {
      if (!meshRef.current) return;
      
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;

      // Update Local Uniforms
      if (material.uniforms.uIntensity) {
          // Smooth Lerp
          material.uniforms.uIntensity.value = THREE.MathUtils.lerp(
              material.uniforms.uIntensity.value, 
              intensity, 
              0.1
          );
      }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  );
};
