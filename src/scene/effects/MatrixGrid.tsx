import { Grid } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/game/store/useGameStore';

export const MatrixGrid = () => {
  const groupRef = useRef<THREE.Group>(null);
  const gridRef = useRef<any>(null); // Ref to the Grid mesh to access material

  const systemIntegrity = useGameStore(state => state.systemIntegrity);

  const SECTION_SIZE = 5;   
  const SPEED = 0.5;

  // --- COLOR PALETTES (Updated for Visibility) ---
  const colors = useMemo(() => ({
    safe: {
      section: new THREE.Color("#003300"), // Dark Green
      cell: new THREE.Color("#044d0f")     // Dim Green
    },
    warning: {
      section: new THREE.Color("#4d3300"), // Deep Brown/Amber
      cell: new THREE.Color("#d48806")     // Bright Amber/Orange
    },
    critical: {
      section: new THREE.Color("#4d0000"), // Deep Maroon
      cell: new THREE.Color("#ff003c")     // Bright Neon Red
    }
  }), []);

  // Internal state for smooth transitions
  const currentSectionColor = useRef(new THREE.Color(colors.safe.section));
  const currentCellColor = useRef(new THREE.Color(colors.safe.cell));

  useFrame((state, delta) => {
    // 1. MOVEMENT (Infinite Scroll)
    if (groupRef.current) {
      groupRef.current.position.z += SPEED * delta;
      if (groupRef.current.position.z >= SECTION_SIZE) {
        groupRef.current.position.z = 0;
      }
    }

    // 2. COLOR TRANSITION LOGIC
    // Determine Target Colors based on Integrity (Matches Header/Panel Logic)
    let targetSection = colors.safe.section;
    let targetCell = colors.safe.cell;

    if (systemIntegrity < 30) {
      targetSection = colors.critical.section;
      targetCell = colors.critical.cell;
    } else if (systemIntegrity < 60) {
      targetSection = colors.warning.section;
      targetCell = colors.warning.cell;
    }

    // Smoothly Lerp current colors towards target (Speed: 3.0 * delta for faster reaction)
    currentSectionColor.current.lerp(targetSection, delta * 3.0);
    currentCellColor.current.lerp(targetCell, delta * 3.0);

    // Apply to Grid Material
    if (gridRef.current && gridRef.current.material) {
        if (gridRef.current.material.uniforms.sectionColor) {
            gridRef.current.material.uniforms.sectionColor.value.copy(currentSectionColor.current);
        }
        if (gridRef.current.material.uniforms.cellColor) {
            gridRef.current.material.uniforms.cellColor.value.copy(currentCellColor.current);
        }
    }
  });

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      <Grid
        ref={gridRef}
        renderOrder={-1}
        infiniteGrid
        cellSize={1}
        sectionSize={SECTION_SIZE}
        
        fadeDistance={25}      
        
        // Initial colors
        sectionColor="#003300"
        cellColor="#044d0f"
        
        sectionThickness={1.2} 
        cellThickness={1.1}
      />
    </group>
  );
};
