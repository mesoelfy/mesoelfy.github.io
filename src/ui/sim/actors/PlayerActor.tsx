import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { GAME_THEME } from '@/ui/sim/config/theme';
import { ServiceLocator } from '@/sys/services/ServiceLocator';
import { Tag } from '@/engine/ecs/types';
import { TransformData } from '@/sys/data/TransformData';
import { RenderData } from '@/sys/data/RenderData';
import { useStore } from '@/sys/state/global/useStore';
import { useGameStore } from '@/sys/state/game/useGameStore';
import { ComponentType } from '@/engine/ecs/ComponentType';
import * as THREE from 'three';

const aliveGeo = new THREE.CircleGeometry(0.1, 16);
const deadGeo = new THREE.CircleGeometry(0.12, 3); 

export const PlayerActor = () => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  
  const { introDone } = useStore(); 
  const animScale = useRef(0);
  const tempColor = useRef(new THREE.Color());

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // --- INTRO FADE ---
    const targetScale = introDone ? 1 : 0;
    animScale.current = THREE.MathUtils.lerp(animScale.current, targetScale, delta * 2.0);
    
    if (animScale.current < 0.01) {
        groupRef.current.visible = false;
        return;
    }
    groupRef.current.visible = true;

    // --- ECS READ ---
    let playerEntity;
    try {
        const registry = ServiceLocator.getRegistry();
        const players = registry.getByTag(Tag.PLAYER);
        for(const p of players) { playerEntity = p; break; }
    } catch { return; }

    if (!playerEntity) return;

    const transform = playerEntity.getComponent<TransformData>(ComponentType.Transform);
    const render = playerEntity.getComponent<RenderData>(ComponentType.Render);
    const isDead = useGameStore.getState().playerHealth <= 0; // Keeping this check for Geo Swap

    if (transform) {
        groupRef.current.position.set(transform.x, transform.y, 0);
    }

    if (render && ringRef.current && coreRef.current && glowRef.current) {
        // Visual Rotation (Spin)
        // We accumulate on Z.
        ringRef.current.rotation.z = render.visualRotation;
        
        // Color
        tempColor.current.setRGB(render.r, render.g, render.b);
        ringRef.current.material.color.copy(tempColor.current);
        coreRef.current.material.color.copy(tempColor.current);
        glowRef.current.material.color.copy(tempColor.current);

        // Scale
        const scale = render.visualScale * animScale.current;
        groupRef.current.scale.setScalar(scale);

        // Geo Swap
        if (isDead) {
            ringRef.current.visible = false;
            glowRef.current.visible = false;
            coreRef.current.geometry = deadGeo;
            coreRef.current.material.wireframe = true; 
            coreRef.current.rotation.z = render.visualRotation; // Dead spin
        } else {
            ringRef.current.visible = true;
            glowRef.current.visible = true;
            coreRef.current.geometry = aliveGeo;
            coreRef.current.material.wireframe = false;
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
