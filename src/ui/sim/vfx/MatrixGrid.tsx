import { Grid } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { useStore } from '@/engine/state/global/useStore';
import { useGameContext } from '@/engine/state/GameContext';
import { Tag } from '@/engine/ecs/types';
import { RenderTransform } from '@/engine/ecs/components/RenderTransform';
import { ComponentType } from '@/engine/ecs/ComponentType';

export const MatrixGrid = () => {
  const { registry } = useGameContext();
  const groupRef = useRef<THREE.Group>(null);
  const gridRef = useRef<any>(null);

  const colors = useMemo(() => ({
    safe: { section: new THREE.Color("#003300"), cell: new THREE.Color("#044d0f") },
    warning: { section: new THREE.Color("#4d3300"), cell: new THREE.Color("#d48806") },
    critical: { section: new THREE.Color("#4d0000"), cell: new THREE.Color("#ff003c") },
    sandbox: { section: new THREE.Color("#001a33"), cell: new THREE.Color("#00F0FF") }
  }), []);

  const currentSectionColor = useRef(new THREE.Color(colors.safe.section));
  const currentCellColor = useRef(new THREE.Color(colors.safe.cell));
  
  useFrame((state, delta) => {
    let worldEntity;
    for(const w of registry.getByTag(Tag.WORLD)) { worldEntity = w; break; }

    if (worldEntity && groupRef.current) {
        const render = worldEntity.getComponent<RenderTransform>(ComponentType.RenderTransform);
        if (render) groupRef.current.position.z = render.rotation % 5;
    }

    const integrity = useGameStore.getState().systemIntegrity;
    const bootState = useStore.getState().bootState;

    let target = bootState === 'sandbox' ? colors.sandbox : (integrity < 30 ? colors.critical : (integrity < 60 ? colors.warning : colors.safe));
    currentSectionColor.current.lerp(target.section, delta * 3.0);
    currentCellColor.current.lerp(target.cell, delta * 3.0);

    if (gridRef.current && gridRef.current.material) {
        const mat = gridRef.current.material;
        if (mat.uniforms.sectionColor) mat.uniforms.sectionColor.value.copy(currentSectionColor.current);
        if (mat.uniforms.cellColor) mat.uniforms.cellColor.value.copy(currentCellColor.current);
    }
  });

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      <group position={[0, 0, -10]}>
        <Grid ref={gridRef} renderOrder={-1} infiniteGrid args={[60, 60]} cellSize={1} sectionSize={5} fadeDistance={30} fadeStrength={2.5} sectionColor="#003300" cellColor="#044d0f" sectionThickness={1.2} cellThickness={1.1} />
      </group>
    </group>
  );
};
