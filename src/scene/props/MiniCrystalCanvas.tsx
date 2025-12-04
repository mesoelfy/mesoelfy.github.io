'use client';

import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SpinningGem = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.z += 0.005;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} scale={1.8}>
        <octahedronGeometry args={[1, 0]} />
        <MeshDistortMaterial
          color="#78F654"
          emissive="#15530A"
          roughness={0.1}
          metalness={0.8}
          distort={0.3}
          speed={2}
          wireframe
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
        style={{ background: '#000000' }} // <--- THE FIX: Force canvas to be black instantly
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#C2FE9A" />
        <SpinningGem />
      </Canvas>
    </div>
  );
};
