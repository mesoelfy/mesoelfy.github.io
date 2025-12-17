import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { Tag } from '@/engine/ecs/types';
import { EnemyTypes } from '@/engine/config/Identifiers';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { ComponentType } from '@/engine/ecs/ComponentType';

const MAX_DAEMONS = 5;
const SQUISH_SCALE_Y = 0.4;
const FULL_SCALE_Y = 1.3;
const WIDTH_SCALE = 1.2;
const SPIN_SPEED = 2.0;

export const DaemonActor = () => {
  const groupRef = useRef<THREE.Group>(null);
  const pool = useMemo(() => {
      const items: { root: THREE.Group, cage: THREE.Mesh, orb: THREE.Mesh }[] = [];
      const cageGeo = new THREE.OctahedronGeometry(0.7, 0); 
      const orbGeo = new THREE.IcosahedronGeometry(0.25, 1);
      const cageMat = new THREE.MeshBasicMaterial({ color: '#00F0FF', wireframe: true, transparent: true, opacity: 0.5, toneMapped: false });
      const orbMat = new THREE.MeshBasicMaterial({ color: '#00F0FF', toneMapped: false });

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
      const registry = ServiceLocator.getRegistry();
      const entities = Array.from(registry.getByTag(Tag.PLAYER)).filter(e => {
          const id = e.getComponent<IdentityData>(ComponentType.Identity);
          return id?.variant === EnemyTypes.DAEMON && e.active;
      });

      for (let i = 0; i < MAX_DAEMONS; i++) {
          const item = pool[i];
          const entity = entities[i]; 

          if (!entity) { item.root.visible = false; continue; }
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
