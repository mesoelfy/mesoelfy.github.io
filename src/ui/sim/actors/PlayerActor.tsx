import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { GAME_THEME } from '@/ui/sim/config/theme';
import { ServiceLocator } from '@/sys/services/ServiceLocator';
import { useGameStore } from '@/sys/state/game/useGameStore';
import { useStore } from '@/sys/state/global/useStore';
import { InteractionSystem, RepairState } from '@/sys/systems/InteractionSystem'; 
import { EntitySystem } from '@/sys/systems/EntitySystem'; // Note: This might be legacy import, safe to ignore type if unused
import * as THREE from 'three';

// GLOBAL REUSABLES (Outside Component)
const colorTurret = new THREE.Color(GAME_THEME.turret.base); 
const colorRepair = new THREE.Color(GAME_THEME.turret.repair); 
const colorReboot = new THREE.Color('#9E4EA5'); 
const colorDead = new THREE.Color('#FF003C'); 
const aliveGeo = new THREE.CircleGeometry(0.1, 16);
const deadGeo = new THREE.CircleGeometry(0.12, 3); 

export const PlayerActor = () => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const { viewport } = useThree();
  
  const { introDone } = useStore(); 

  const animScale = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // FADE IN LOGIC
    const targetScale = introDone ? 1 : 0;
    animScale.current = THREE.MathUtils.lerp(animScale.current, targetScale, delta * 2.0);
    
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

    // 2. State Access (No allocation)
    const storeState = useGameStore.getState();
    const isDead = storeState.playerHealth <= 0;
    const isGameOver = storeState.systemIntegrity <= 0;

    let repairState: RepairState = 'IDLE';
    try {
        const sys = ServiceLocator.getSystem<InteractionSystem>('InteractionSystem');
        repairState = sys.repairState;
    } catch {}
    
    let targetColor = colorTurret;
    if (repairState === 'HEALING') targetColor = colorRepair; 
    if (repairState === 'REBOOTING') targetColor = colorReboot; 

    // 3. Visuals
    if (ringRef.current && coreRef.current && glowRef.current) {
        let currentBaseScale = 1.0;

        if (isDead || isGameOver) {
            // DEAD STATE
            ringRef.current.visible = false;
            glowRef.current.visible = false;
            
            coreRef.current.geometry = deadGeo;
            coreRef.current.material.color.copy(colorDead); // Use copy
            coreRef.current.material.wireframe = true; 
            
            const isRebooting = repairState === 'REBOOTING';
            if (isRebooting) {
                coreRef.current.rotation.z -= delta * 10.0;
                // Particle spawning removed from here to keep Renderer pure. 
                // Logic handles particles via InteractionSystem events now.
            } else {
                coreRef.current.rotation.z += delta * 1.5; 
            }
            
        } else {
            // ALIVE STATE
            ringRef.current.visible = true;
            glowRef.current.visible = true;
            coreRef.current.geometry = aliveGeo;
            coreRef.current.material.wireframe = false;
            
            if (repairState !== 'IDLE') {
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
        
        groupRef.current.scale.setScalar(animScale.current);
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
