import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { GAME_THEME } from '../theme';
import { GameEngine } from '../core/GameEngine';
import { ServiceLocator } from '../core/ServiceLocator';
import { useGameStore } from '../store/useGameStore';
import * as THREE from 'three';

export const PlayerAvatar = () => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const { viewport } = useThree();

  const colorTurret = new THREE.Color(GAME_THEME.turret.base);
  const colorRepair = new THREE.Color(GAME_THEME.turret.repair);
  const colorDead = new THREE.Color('#78F654'); // Green
  const colorReboot = new THREE.Color('#eae747'); // Yellow

  const isDead = useGameStore(state => state.playerHealth <= 0);

  // Alive: Small Circle
  const aliveGeo = new THREE.CircleGeometry(0.1, 16);
  // Dead: Hollow Triangle (Ring with 3 segments)
  const deadGeo = new THREE.RingGeometry(0.15, 0.2, 3);

  useFrame((state) => {
    if (!groupRef.current) return;

    const x = (state.pointer.x * viewport.width) / 2;
    const y = (state.pointer.y * viewport.height) / 2;
    groupRef.current.position.x = x;
    groupRef.current.position.y = y;

    if (ServiceLocator.inputSystem) {
        ServiceLocator.inputSystem.updateCursor(x, y);
    }

    const isRepairing = GameEngine.isRepairing;
    
    if (ringRef.current && coreRef.current && glowRef.current) {
        if (isDead) {
            // DEAD STATE
            ringRef.current.visible = false;
            
            // Only show glow if we are actively rebooting
            glowRef.current.visible = isRepairing;
            glowRef.current.material.color.set(colorReboot);
            
            coreRef.current.geometry = deadGeo;
            coreRef.current.material.color.set(isRepairing ? colorReboot : colorDead);
            
            if (isRepairing) {
               // Revival Animation: Fast Spin & Pulse
               coreRef.current.rotation.z -= 0.5; 
               coreRef.current.scale.setScalar(1.5 + Math.sin(state.clock.elapsedTime * 30) * 0.2);
            } else {
               // Idle Dead
               coreRef.current.rotation.z = Math.PI; 
               coreRef.current.scale.setScalar(1.0);
            }
        } else {
            // ALIVE STATE
            ringRef.current.visible = true;
            glowRef.current.visible = true;
            coreRef.current.geometry = aliveGeo;
            
            if (isRepairing) {
                // Repairing Panel Animation
                ringRef.current.rotation.z += 0.4; 
                ringRef.current.material.color.lerp(colorRepair, 0.4);
                const pulse = 1.2 + Math.sin(state.clock.elapsedTime * 20) * 0.2;
                ringRef.current.scale.setScalar(pulse);
                coreRef.current.material.color.lerp(colorRepair, 0.4);
                glowRef.current.material.color.lerp(colorRepair, 0.4);
            } else {
                // Normal Combat
                ringRef.current.rotation.z -= 0.02; 
                ringRef.current.material.color.lerp(colorTurret, 0.1);
                ringRef.current.scale.setScalar(1);
                coreRef.current.material.color.lerp(colorTurret, 0.1);
                glowRef.current.material.color.lerp(colorTurret, 0.1);
            }
        }
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={coreRef}>
        <bufferGeometry />
        <meshBasicMaterial color={GAME_THEME.turret.base} />
      </mesh>

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
