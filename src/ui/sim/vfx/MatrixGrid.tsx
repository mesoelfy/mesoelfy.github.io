import { Grid } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { ServiceLocator } from '@/game/services/ServiceLocator';
import { Tag } from '@/core/ecs/types';
import { RenderData } from '@/game/data/RenderData';
import { ComponentType } from '@/core/ecs/ComponentType';

export const MatrixGrid = () => {
  const groupRef = useRef<THREE.Group>(null);
  const gridRef = useRef<any>(null);
  
  const SECTION_SIZE = 5;   
  const tempColor = useRef(new THREE.Color());

  useFrame((state, delta) => {
    // --- ECS READ ---
    let worldEntity;
    try {
        const registry = ServiceLocator.getRegistry();
        const worlds = registry.getByTag(Tag.WORLD);
        for(const w of worlds) { worldEntity = w; break; }
    } catch { return; }

    if (!worldEntity) return;

    const render = worldEntity.getComponent<RenderData>(ComponentType.Render);

    if (render) {
        // SCROLLING: Controlled by visualRotation (used as Z offset)
        // We modulo it here to keep precision safe
        const zOffset = render.visualRotation % SECTION_SIZE;
        if (groupRef.current) {
            groupRef.current.position.z = zOffset;
        }

        // COLOR:
        tempColor.current.setRGB(render.r, render.g, render.b);
        
        if (gridRef.current && gridRef.current.material) {
            if (gridRef.current.material.uniforms.sectionColor) {
                gridRef.current.material.uniforms.sectionColor.value.copy(tempColor.current);
            }
            if (gridRef.current.material.uniforms.cellColor) {
                // Slightly brighter cell color
                gridRef.current.material.uniforms.cellColor.value.copy(tempColor.current).multiplyScalar(1.5);
            }
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
