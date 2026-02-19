import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameContext } from '@/engine/state/GameContext';
import { Tag } from '@/engine/ecs/types';
import { EnemyTypes } from '@/engine/config/Identifiers';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { PALETTE } from '@/engine/config/Palette';

const MAX_DAEMONS = 5;
const SQUISH_SCALE_Y = 0.4;
const FULL_SCALE_Y = 1.3;
const WIDTH_SCALE = 1.2;
const SPIN_SPEED = 2.0;

export const DaemonActor = () => {
  const { registry } = useGameContext();
  const groupRef = useRef<THREE.Group>(null);
  const pool = useMemo(() => {
      const items: { root: THREE.Group, cage: THREE.Mesh, orb: THREE.Mesh }[] = [];
      const cageGeo = new THREE.OctahedronGeometry(0.7, 0); 
      const orbGeo = new THREE.IcosahedronGeometry(0.25, 1);
      const cageMat = new THREE.MeshBasicMaterial({ color: PALETTE.PINK.PRIMARY, wireframe: true, transparent: true, opacity: 0.5, toneMapped: false });
      const orbMat = new THREE.MeshBasicMaterial({ color: PALETTE.PINK.PRIMARY, toneMapped: false });

      for(let i=0; i<MAX_DAEMONS; i++) {
          const root = new THREE.Group();
          const cage = new THREE.Mesh(cageGeo, cageMat);
          const orb = new THREE.Mesh(orbGeo, orbMat);
          root.add(cage); root.add(orb);
          root.visible = false;
          items.push({ root, cage, orb });
      }
      return items;
  }, []);

  useFrame((state, delta) => {
      if (!groupRef.current) return;
      
      let activeCount = 0;
      
      // ZERO-ALLOCATION ITERATION
      for (const entity of registry.getByTag(Tag.PLAYER)) {
          if (!entity.active) continue;
          
          const id = entity.getComponent<IdentityData>(ComponentType.Identity);
          if (id?.variant === EnemyTypes.DAEMON) {
              const item = pool[activeCount];
              item.root.visible = true;
              
              const transform = entity.getComponent<TransformData>(ComponentType.Transform);
              const ai = entity.getComponent<AIStateData>(ComponentType.State);

              if (transform && ai) {
                  item.root.position.set(transform.x, transform.y, 0);
                  const charge = ai.data.chargeProgress || 0;
                  const currentScaleY = THREE.MathUtils.lerp(SQUISH_SCALE_Y, FULL_SCALE_Y, charge);
                  const currentScaleXZ = THREE.MathUtils.lerp(WIDTH_SCALE, 1.0, charge);
                  item.cage.scale.set(currentScaleXZ, currentScaleY, currentScaleXZ);
                  item.cage.rotation.y += delta * SPIN_SPEED;
                  item.cage.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
                  const orbScale = THREE.MathUtils.lerp(0, 1, charge);
                  item.orb.scale.setScalar(orbScale);
                  if (charge >= 1.0) item.orb.scale.multiplyScalar(1.0 + Math.sin(state.clock.elapsedTime * 10) * 0.1);
              }
              
              activeCount++;
              if (activeCount >= MAX_DAEMONS) break;
          }
      }

      // Hide the rest of the pool
      for (let i = activeCount; i < MAX_DAEMONS; i++) {
          pool[i].root.visible = false;
      }
  });

  return (
    <group ref={groupRef}>
        {pool.map((item, i) => (
            <primitive key={i} object={item.root} />
        ))}
    </group>
  );
};
