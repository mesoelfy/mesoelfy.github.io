import { Grid } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/sys/state/game/useGameStore';
import { useStore } from '@/sys/state/global/useStore';

export const MatrixGrid = () => {
  const groupRef = useRef<THREE.Group>(null);
  const gridRef = useRef<any>(null);

  const systemIntegrity = useGameStore(state => state.systemIntegrity);
  const bootState = useStore(state => state.bootState);

  const SECTION_SIZE = 5;   
  const SPEED = 0.5;

  const colors = useMemo(() => ({
    safe: {
      section: new THREE.Color("#003300"),
      cell: new THREE.Color("#044d0f")
    },
    warning: {
      section: new THREE.Color("#4d3300"),
      cell: new THREE.Color("#d48806")
    },
    critical: {
      section: new THREE.Color("#4d0000"),
      cell: new THREE.Color("#ff003c")
    },
    sandbox: {
      section: new THREE.Color("#001a33"), 
      cell: new THREE.Color("#00F0FF")     
    }
  }), []);

  const currentSectionColor = useRef(new THREE.Color(colors.safe.section));
  const currentCellColor = useRef(new THREE.Color(colors.safe.cell));

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.z += SPEED * delta;
      // Loop logic for infinite scrolling effect
      if (groupRef.current.position.z >= SECTION_SIZE) {
        groupRef.current.position.z = 0;
      }
    }

    let targetSection = colors.safe.section;
    let targetCell = colors.safe.cell;

    if (bootState === 'sandbox') {
        targetSection = colors.sandbox.section;
        targetCell = colors.sandbox.cell;
    } else if (systemIntegrity < 30) {
      targetSection = colors.critical.section;
      targetCell = colors.critical.cell;
    } else if (systemIntegrity < 60) {
      targetSection = colors.warning.section;
      targetCell = colors.warning.cell;
    }

    currentSectionColor.current.lerp(targetSection, delta * 3.0);
    currentCellColor.current.lerp(targetCell, delta * 3.0);

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
      {/* 
         FIX: Nested group to offset geometry without breaking the scrolling logic.
         Z = -10 shifts the center point forward so the "front" edge is well behind the camera.
      */}
      <group position={[0, 0, -10]}>
        <Grid
          ref={gridRef}
          renderOrder={-1}
          infiniteGrid
          
          args={[60, 60]} 
          
          cellSize={1}
          sectionSize={SECTION_SIZE}
          
          // FIX: Reduced fadeDistance slightly to hide distant sub-pixels
          fadeDistance={bootState === 'sandbox' ? 35 : 30}
          
          // FIX: Increased fadeStrength (default is 1)
          // Higher values = sharper falloff. This hides the distant Moiré patterns.
          fadeStrength={2.5}
          
          sectionColor="#003300"
          cellColor="#044d0f"
          sectionThickness={1.2} 
          cellThickness={1.1}
        />
      </group>
    </group>
  );
};
