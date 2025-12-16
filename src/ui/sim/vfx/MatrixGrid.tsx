import { Grid } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { useStore } from '@/engine/state/global/useStore';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { Tag } from '@/engine/ecs/types';
import { RenderData } from '@/engine/ecs/components/RenderData';
import { ComponentType } from '@/engine/ecs/ComponentType';

export const MatrixGrid = () => {
  const groupRef = useRef<THREE.Group>(null);
  const gridRef = useRef<any>(null);

  // 1. Restore specific palettes from the old build
  const colors = useMemo(() => ({
    safe: {
      section: new THREE.Color("#003300"),
      cell: new THREE.Color("#044d0f")
    },
    warning: {
      section: new THREE.Color("#4d3300"),
      cell: new THREE.Color("#d48806") // Amber/Orange
    },
    critical: {
      section: new THREE.Color("#4d0000"),
      cell: new THREE.Color("#ff003c") // Critical Red
    },
    sandbox: {
      section: new THREE.Color("#001a33"), 
      cell: new THREE.Color("#00F0FF") // Cyan
    }
  }), []);

  const currentSectionColor = useRef(new THREE.Color(colors.safe.section));
  const currentCellColor = useRef(new THREE.Color(colors.safe.cell));
  
  const SECTION_SIZE = 5;

  useFrame((state, delta) => {
    // --- MOTION SYNC (ECS) ---
    // We still use the ECS entity to drive movement, ensuring it respects 
    // game pauses, slow-mo, and speed changes managed by TimeSystem.
    let worldEntity;
    try {
        const registry = ServiceLocator.getRegistry();
        const worlds = registry.getByTag(Tag.WORLD);
        for(const w of worlds) { worldEntity = w; break; }
    } catch { return; }

    if (worldEntity && groupRef.current) {
        const render = worldEntity.getComponent<RenderData>(ComponentType.Render);
        if (render) {
             const zOffset = render.visualRotation % SECTION_SIZE;
             groupRef.current.position.z = zOffset;
        }
    }

    // --- COLOR LOGIC (STATE) ---
    // We revert to reading state directly for color to get the specific palettes back.
    const systemIntegrity = useGameStore.getState().systemIntegrity;
    const bootState = useStore.getState().bootState;

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

    // Smooth Interpolation
    currentSectionColor.current.lerp(targetSection, delta * 3.0);
    currentCellColor.current.lerp(targetCell, delta * 3.0);

    if (gridRef.current && gridRef.current.material) {
        const mat = gridRef.current.material;
        if (mat.uniforms.sectionColor) {
            mat.uniforms.sectionColor.value.copy(currentSectionColor.current);
        }
        if (mat.uniforms.cellColor) {
            mat.uniforms.cellColor.value.copy(currentCellColor.current);
        }
    }
  });

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      <group position={[0, 0, -10]}>
        <Grid
          ref={gridRef}
          renderOrder={-1}
          infiniteGrid
          args={[60, 60]} 
          cellSize={1}
          sectionSize={SECTION_SIZE}
          // Tuned values from old build
          fadeDistance={30}
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
