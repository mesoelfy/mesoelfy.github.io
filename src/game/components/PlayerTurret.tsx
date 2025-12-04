import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { GAME_THEME } from '../theme';
import { GameEngine } from '../core/GameEngine';
import * as THREE from 'three';

export const PlayerTurret = () => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const { viewport } = useThree();

  const colorTurret = new THREE.Color(GAME_THEME.turret.base);
  const colorRepair = new THREE.Color(GAME_THEME.turret.repair);

  useFrame((state) => {
    if (!groupRef.current) return;

    const x = (state.pointer.x * viewport.width) / 2;
    const y = (state.pointer.y * viewport.height) / 2;
    groupRef.current.position.x = x;
    groupRef.current.position.y = y;

    GameEngine.updateCursor(x, y);

    const isRepairing = GameEngine.isRepairing;
    
    // Rotate Reticle
    if (ringRef.current) {
      if (isRepairing) {
        ringRef.current.rotation.z += 0.2; 
        ringRef.current.material.color.lerp(colorRepair, 0.2);
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 20) * 0.1;
        ringRef.current.scale.setScalar(pulse);
      } else {
        ringRef.current.rotation.z -= 0.02; 
        ringRef.current.material.color.lerp(colorTurret, 0.1);
        ringRef.current.scale.setScalar(1);
      }
    }

    if (coreRef.current) {
      coreRef.current.material.color.lerp(isRepairing ? colorRepair : colorTurret, 0.2);
    }
    if (glowRef.current) {
      glowRef.current.material.color.lerp(isRepairing ? colorRepair : colorTurret, 0.2);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Core */}
      <mesh ref={coreRef}>
        <circleGeometry args={[0.1, 16]} />
        <meshBasicMaterial color={GAME_THEME.turret.base} />
      </mesh>

      {/* SQUARE RING (4 Segments) */}
      <mesh ref={ringRef} rotation={[0, 0, Math.PI / 4]}>
        <ringGeometry args={[0.4, 0.45, 4]} /> 
        <meshBasicMaterial color={GAME_THEME.turret.base} transparent opacity={0.8} />
      </mesh>

      <sprite ref={glowRef} scale={[2, 2, 1]}>
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
