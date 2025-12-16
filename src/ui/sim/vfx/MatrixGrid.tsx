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
    let worldEntity;
    try {
        const registry = ServiceLocator.getRegistry();
        // Use the cache-optimized getByTag
        const worlds = registry.getByTag(Tag.WORLD);
        for(const w of worlds) { worldEntity = w; break; }
    } catch { return; }

    if (!worldEntity) return;

    const render = worldEntity.getComponent<RenderData>(ComponentType.Render);

    if (render) {
        // 1. MOTION (Z-Scrolling)
        // Controlled by visualRotation (used as Z offset)
        const zOffset = render.visualRotation % SECTION_SIZE;
        if (groupRef.current) {
            groupRef.current.position.z = zOffset;
        }

        // 2. COLOR SYNC
        tempColor.current.setRGB(render.r, render.g, render.b);
        
        // Safety check for Grid material uniforms
        if (gridRef.current && gridRef.current.material) {
            const mat = gridRef.current.material;
            
            // Drei GridShader uses 'sectionColor' and 'cellColor' uniforms
            if (mat.uniforms.sectionColor) {
                mat.uniforms.sectionColor.value.copy(tempColor.current);
            }
            if (mat.uniforms.cellColor) {
                // Boost brightness for cells
                mat.uniforms.cellColor.value.copy(tempColor.current).multiplyScalar(1.5);
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
          // Default colors (will be overridden by frame loop)
          sectionColor="#003300"
          cellColor="#044d0f"
          sectionThickness={1.2} 
          cellThickness={1.1}
        />
      </group>
    </group>
  );
};
