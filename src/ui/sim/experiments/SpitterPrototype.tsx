import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MaterialFactory } from '@/engine/graphics/MaterialFactory';
import { ShaderLib } from '@/engine/graphics/ShaderLib';
import { Uniforms } from '@/engine/graphics/Uniforms';
import { PALETTE } from '@/engine/config/Palette';

export const SpitterPrototype = ({ intensity = 0.5 }: { intensity: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // High detail for smooth undulation
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 16), []);

  const material = useMemo(() => {
      return MaterialFactory.create('MAT_SPITTER_PROTO', {
          ...ShaderLib.presets.spitter_proto,
          uniforms: {
              [Uniforms.COLOR]: { value: new THREE.Color(PALETTE.PURPLE.PRIMARY) },
              [Uniforms.INTENSITY]: { value: 0.5 },
              [Uniforms.SPEED]: { value: 2.0 }
          }
      });
  }, []);

  useFrame((state) => {
      if (!meshRef.current) return;
      MaterialFactory.updateUniforms(state.clock.elapsedTime);
      
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.z += 0.002;
      
      if (material.uniforms[Uniforms.INTENSITY]) {
          material.uniforms[Uniforms.INTENSITY].value = intensity;
      }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
};
