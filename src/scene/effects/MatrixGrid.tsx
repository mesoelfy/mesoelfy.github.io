import { Grid } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export const MatrixGrid = () => {
  const groupRef = useRef<THREE.Group>(null);

  const SECTION_SIZE = 5;   
  const SPEED = 0.5;

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.z += SPEED * delta;
      
      if (groupRef.current.position.z >= SECTION_SIZE) {
        groupRef.current.position.z = 0;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      <Grid
        renderOrder={-1}
        infiniteGrid
        cellSize={1}
        sectionSize={SECTION_SIZE}
        
        // FIX 1: Fade out sooner (25) to hide far-away aliasing
        fadeDistance={25}      
        
        // FIX 2: Much darker colors to reduce "Shimmer" and visual weight
        sectionColor="#003300" // Very subtle dark green
        cellColor="#044d0f"    // Darker dim green (less contrast = less aliasing)
        
        sectionThickness={1.2} 
        cellThickness={1.1}
      />
    </group>
  );
};
