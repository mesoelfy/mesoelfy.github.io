import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MaterialFactory } from '@/engine/graphics/MaterialFactory';
import { ShaderLib } from '@/engine/graphics/ShaderLib';
import { Uniforms } from '@/engine/graphics/Uniforms';
import { PALETTE } from '@/engine/config/Palette';
import { DOM_ID } from '@/ui/config/DOMConfig';

interface Props {
    detail: number;
}

export const HunterExperiment = ({ detail = 1 }: Props) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, detail), [detail]);

  const material = useMemo(() => {
      // Define custom uniforms for the Energy Shader
      const customUniforms = {
          [Uniforms.COLOR]: { value: new THREE.Color(PALETTE.ORANGE.PRIMARY) },
          [Uniforms.INTENSITY]: { value: 0.5 },
          [Uniforms.SPEED]: { value: 1.0 },
          uFresnelPower: { value: 2.0 },
          uNoiseStr: { value: 0.5 },
          uCoreOpacity: { value: 0.8 }
      };

      return MaterialFactory.create('MAT_HUNTER_LAB', {
          ...ShaderLib.presets.hunter_energy,
          uniforms: customUniforms
      });
  }, []);

  useFrame((state) => {
      if (!meshRef.current) return;
      MaterialFactory.updateUniforms(state.clock.elapsedTime);
      
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.z += 0.002;
      
      // Read params from DOM (Data attributes set by UI sliders)
      const el = document.getElementById(DOM_ID.LAB_PARAMS);
      if (el) {
          const intensity = parseFloat(el.dataset.a || '0.5');
          const fresnel = parseFloat(el.dataset.b || '2.0');
          const noiseStr = parseFloat(el.dataset.c || '0.5');
          const coreOp = parseFloat(el.dataset.d || '0.8');

          if (material.uniforms[Uniforms.INTENSITY]) material.uniforms[Uniforms.INTENSITY].value = intensity;
          if (material.uniforms.uFresnelPower) material.uniforms.uFresnelPower.value = fresnel;
          if (material.uniforms.uNoiseStr) material.uniforms.uNoiseStr.value = noiseStr;
          if (material.uniforms.uCoreOpacity) material.uniforms.uCoreOpacity.value = coreOp;
      }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
};
