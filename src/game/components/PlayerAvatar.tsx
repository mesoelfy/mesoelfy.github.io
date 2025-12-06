import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { GAME_THEME } from '../theme';
import { ServiceLocator } from '../core/ServiceLocator';
import { useGameStore } from '../store/useGameStore';
import { useStore } from '@/core/store/useStore';
import { InteractionSystem, RepairState } from '../systems/InteractionSystem'; 
import * as THREE from 'three';

export const PlayerAvatar = () => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const { viewport } = useThree();
  
  const { introDone } = useStore(); // Access Intro State

  const colorTurret = new THREE.Color(GAME_THEME.turret.base); 
  const colorRepair = new THREE.Color(GAME_THEME.turret.repair); 
  const colorReboot = new THREE.Color('#9E4EA5'); 
  const colorDead = new THREE.Color('#78F654'); 

  const isDead = useGameStore(state => state.playerHealth <= 0);
  const aliveGeo = new THREE.CircleGeometry(0.1, 16);
  const deadGeo = new THREE.RingGeometry(0.15, 0.2, 3);
  
  // Animation State for Fade-In
  const animScale = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // FADE IN LOGIC
    const targetScale = introDone ? 1 : 0;
    animScale.current = THREE.MathUtils.lerp(animScale.current, targetScale, delta * 2.0);
    
    // Apply Global Scale (Entrance Animation)
    // If intro is not done, we hide it.
    if (animScale.current < 0.01) {
        groupRef.current.visible = false;
        return;
    }
    groupRef.current.visible = true;

    // 1. Position
    const x = (state.pointer.x * viewport.width) / 2;
    const y = (state.pointer.y * viewport.height) / 2;
    groupRef.current.position.x = x;
    groupRef.current.position.y = y;

    try { ServiceLocator.getInputService().updateCursor(x, y); } catch {}

    // 2. State
    let repairState: RepairState = 'IDLE';
    try {
        const sys = ServiceLocator.getSystem<InteractionSystem>('InteractionSystem');
        repairState = sys.repairState;
    } catch {}
    
    const isRepairing = repairState !== 'IDLE';
    let targetColor = colorTurret;
    if (repairState === 'HEALING') targetColor = colorRepair; 
    if (repairState === 'REBOOTING') targetColor = colorReboot; 

    // 3. Visuals
    if (ringRef.current && coreRef.current && glowRef.current) {
        // Base Scale (multiplied by animScale)
        let currentBaseScale = 1.0;

        if (isDead) {
            ringRef.current.visible = false;
            glowRef.current.visible = isRepairing;
            glowRef.current.material.color.set(colorReboot);
            
            coreRef.current.geometry = deadGeo;
            coreRef.current.material.color.set(isRepairing ? colorReboot : colorDead);
            
            if (isRepairing) {
               coreRef.current.rotation.z -= 0.5; 
               currentBaseScale = 1.5 + Math.sin(state.clock.elapsedTime * 30) * 0.2;
            } else {
               coreRef.current.rotation.z = Math.PI; 
            }
        } else {
            ringRef.current.visible = true;
            glowRef.current.visible = true;
            coreRef.current.geometry = aliveGeo;
            
            if (isRepairing) {
                ringRef.current.rotation.z += 0.4; 
                ringRef.current.material.color.lerp(targetColor, 0.4);
                coreRef.current.material.color.lerp(targetColor, 0.4);
                glowRef.current.material.color.lerp(targetColor, 0.4);
                
                const pulse = 1.2 + Math.sin(state.clock.elapsedTime * 20) * 0.2;
                currentBaseScale = pulse;
            } else {
                ringRef.current.rotation.z -= 0.02; 
                ringRef.current.material.color.lerp(colorTurret, 0.1);
                coreRef.current.material.color.lerp(colorTurret, 0.1);
                glowRef.current.material.color.lerp(colorTurret, 0.1);
            }
        }
        
        // Apply Final Scale (Entrance * State)
        const finalScale = animScale.current * currentBaseScale;
        
        // Apply to sub-meshes individually or group? Group is easier for entrance.
        // But we have logic that sets scale on sub-meshes. Let's apply to group.
        groupRef.current.scale.setScalar(animScale.current);
        
        // The sub-logic above set scalar on coreRef, we should respect that relative to group.
        // Actually, previous logic set scale on coreRef/ringRef directly.
        // Let's modify the previous logic to set local scale, while group handles global entrance.
        coreRef.current.scale.setScalar(currentBaseScale);
        ringRef.current.scale.setScalar(currentBaseScale); 
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
