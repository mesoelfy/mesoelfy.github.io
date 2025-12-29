import { useStore } from '@/engine/state/global/useStore';
import { OrbitControls } from '@react-three/drei';
import { GlitchGhost } from '../experiments/GlitchGhost';
import { SpitterPrototype } from '../experiments/SpitterPrototype';
import { SpitterOptimized } from '../experiments/SpitterOptimized';
import { useFrame } from '@react-three/fiber';
import { useState } from 'react';
import { MaterialFactory } from '@/engine/graphics/MaterialFactory';
import { DOM_ID } from '@/ui/config/DOMConfig';

export const LabStage = () => {
  const { labExperiment } = useStore();
  const [intensity, setIntensity] = useState(0.5);

  useFrame((state) => {
      MaterialFactory.updateUniforms(state.clock.elapsedTime);
      const el = document.getElementById(DOM_ID.LAB_PARAMS);
      if (el) {
          const val = parseFloat(el.dataset.a || '0.5');
          if (val !== intensity) setIntensity(val);
      }
  });

  if (labExperiment === 'NONE') return null;

  return (
    <>
        <OrbitControls makeDefault />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1.0} color="#00F0FF" />
        <pointLight position={[-10, -5, -5]} intensity={0.5} color="#FF003C" />
        <group position={[0, 0, 0]}>
            {labExperiment === 'GLITCH' && <GlitchGhost intensity={intensity} />}
            {labExperiment === 'SPITTER' && <SpitterPrototype intensity={intensity} />}
            {labExperiment === 'SPITTER_OPT' && <SpitterOptimized intensity={intensity} />}
        </group>
    </>
  );
};
