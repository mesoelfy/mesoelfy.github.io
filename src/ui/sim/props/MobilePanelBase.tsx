import { useMemo } from 'react';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { PanelId } from '@/engine/config/PanelConfig';
import * as THREE from 'three';

export const MobilePanelBase = () => {
  const panel = useGameStore(s => s.panels[PanelId.SOCIAL]);
  const isDead = panel ? panel.isDestroyed : false;

  // We render a plane at roughly the same dimensions as the CSS panel
  // CSS Panel is max-w-sm (approx 24rem = 384px)
  // In our Ortho camera (Zoom 40), 384px is approx 9.6 world units width.
  // Height is set to fit content, approx 13 world units.
  
  const width = 9.6;
  const height = 13;

  return (
    <mesh position={[0, 0, -1]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial 
        color={isDead ? "#1a0505" : "#000500"} 
        transparent 
        opacity={0.9} 
      />
      {/* Grid Overlay */}
      <lineSegments position={[0, 0, 0.01]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(width, height)]} />
        <lineBasicMaterial color={isDead ? "#FF003C" : "#78F654"} transparent opacity={0.3} />
      </lineSegments>
    </mesh>
  );
};
