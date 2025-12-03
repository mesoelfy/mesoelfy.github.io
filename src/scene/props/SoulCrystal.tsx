import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

export const SoulCrystal = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      meshRef.current.rotation.y = t * 0.5;
      meshRef.current.rotation.z = t * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} scale={1.5}>
        <octahedronGeometry args={[1, 0]} />
        <MeshDistortMaterial
          color="#00ff41"
          emissive="#003300"
          roughness={0}
          metalness={1}
          distort={0.4}
          speed={2}
          wireframe
        />
      </mesh>
      {/* Inner Core Glow */}
      <mesh scale={0.8}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#ccffcc" transparent opacity={0.5} />
      </mesh>
    </Float>
  );
};
