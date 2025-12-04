import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { GAME_THEME } from '../theme';
import { GameEngine } from '../core/GameEngine';
import * as THREE from 'three';

export const PlayerTurret = () => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    if (!groupRef.current) return;

    // 1. Map Mouse to Viewport
    const x = (state.pointer.x * viewport.width) / 2;
    const y = (state.pointer.y * viewport.height) / 2;

    // 2. Position Visuals
    groupRef.current.position.x = x;
    groupRef.current.position.y = y;

    // 3. REPORT TO ENGINE (Targeting System)
    GameEngine.updateCursor(x, y);

    // 4. Rotate Reticle
    if (ringRef.current) {
      ringRef.current.rotation.z -= 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <circleGeometry args={[0.15, 16]} />
        <meshBasicMaterial color={GAME_THEME.turret.base} />
      </mesh>

      <mesh ref={ringRef}>
        <ringGeometry args={[0.3, 0.35, 32]} />
        <meshBasicMaterial color={GAME_THEME.turret.base} transparent opacity={0.6} />
      </mesh>

      <sprite scale={[1.5, 1.5, 1]}>
        <spriteMaterial 
          color={GAME_THEME.turret.glow} 
          transparent 
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </group>
  );
};
