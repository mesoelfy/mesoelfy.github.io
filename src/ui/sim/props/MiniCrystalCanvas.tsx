'use client';

import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { PALETTE } from '@/engine/config/Palette';
import { useGameStream } from '@/ui/hooks/useGameStream';

const COLORS = {
  SAFE: new THREE.Color(PALETTE.GREEN.PRIMARY),
  WARN: new THREE.Color(PALETTE.YELLOW.SOFT),
  CRIT: new THREE.Color(PALETTE.RED.LIGHT), 
  EMISSIVE_SAFE: new THREE.Color(PALETTE.GREEN.DARK),
  EMISSIVE_WARN: new THREE.Color(PALETTE.YELLOW.DIM),
  EMISSIVE_CRIT: new THREE.Color(PALETTE.RED.DIM), 
  // Healing Colors
  HEAL_BASE: new THREE.Color(PALETTE.YELLOW.GOLD),
  HEAL_EMISSIVE: new THREE.Color(PALETTE.YELLOW.ALERT),
  // Revive Colors (Dark Yellow)
  REVIVE_BASE: new THREE.Color('#8A7000'),
  REVIVE_EMISSIVE: new THREE.Color('#665200'),
};

const SpinningGem = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  
  const integrity = useGameStore(state => state.systemIntegrity);
  const [interactionState, setInteractionState] = useState(0);

  // Sync high-frequency state
  useGameStream('PLAYER_INTERACTION_STATE', setInteractionState);

  const currentColor = useRef(COLORS.SAFE.clone());
  const currentEmissive = useRef(COLORS.EMISSIVE_SAFE.clone());

  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    let targetColor = COLORS.SAFE;
    let targetEmissive = COLORS.EMISSIVE_SAFE;
    let speed = 0.01;
    let distort = 0.3;
    let shake = 0;
    let wireframe = true;

    // 1. STATE LOGIC
    if (interactionState === 1) { // HEALING (Standard)
        targetColor = COLORS.HEAL_BASE;
        targetEmissive = COLORS.HEAL_EMISSIVE;
        speed = 0.15; // Fast spin
        distort = 0.6;
        wireframe = false; // SOLID
    } else if (interactionState === 2) { // REVIVING (Dark Yellow)
        targetColor = COLORS.REVIVE_BASE;
        targetEmissive = COLORS.REVIVE_EMISSIVE;
        speed = 0.05;
        distort = 1.0; // Extreme distortion
        wireframe = false; // SOLID
    } else {
        // IDLE Logic
        if (integrity < 30) {
            targetColor = COLORS.CRIT;
            targetEmissive = COLORS.EMISSIVE_CRIT;
            speed = 0.08; 
            distort = 0.8;
            shake = 0.1;
        } else if (integrity < 60) {
            targetColor = COLORS.WARN;
            targetEmissive = COLORS.EMISSIVE_WARN;
            speed = 0.04;
            distort = 0.5;
            shake = 0.02;
        }
    }

    // 2. APPLY PHYSICS
    meshRef.current.rotation.y += speed;
    meshRef.current.rotation.z += speed * 0.5;
    
    if (shake > 0) {
        meshRef.current.position.x = (Math.random() - 0.5) * shake;
        meshRef.current.position.y = (Math.random() - 0.5) * shake;
    } else {
        meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, 0, 0.1);
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0, 0.1);
    }

    // 3. COLOR LERP
    currentColor.current.lerp(targetColor, delta * 5.0);
    currentEmissive.current.lerp(targetEmissive, delta * 5.0);

    // 4. UPDATE MATERIAL
    materialRef.current.color.copy(currentColor.current);
    materialRef.current.emissive.copy(currentEmissive.current);
    materialRef.current.distort = THREE.MathUtils.lerp(materialRef.current.distort, distort, delta);
    materialRef.current.wireframe = wireframe;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} scale={1.8}>
        <octahedronGeometry args={[1, 0]} />
        <MeshDistortMaterial
          ref={materialRef}
          color={PALETTE.GREEN.PRIMARY}
          emissive={PALETTE.GREEN.DARK}
          roughness={0.1}
          metalness={0.9}
          distort={0.3}
          speed={2}
          wireframe={true}
        />
      </mesh>
    </Float>
  );
};

export const MiniCrystalCanvas = () => {
  return (
    <div className="w-full h-full bg-black">
      <Canvas 
        camera={{ position: [0, 0, 5] }} 
        gl={{ alpha: true }}
        style={{ background: '#000000' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color={PALETTE.GREEN.GLOW} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color={PALETTE.PURPLE.PRIMARY} />
        <SpinningGem />
      </Canvas>
    </div>
  );
};
