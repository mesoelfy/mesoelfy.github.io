import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Registry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { LifetimeComponent } from '../components/data/LifetimeComponent';

const MAX_PARTICLES = 1000;
const tempObj = new THREE.Object3D();
const tempColor = new THREE.Color();

export const ParticleRenderer = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(0.1, 0.1), []);

  useFrame(() => {
    if (!meshRef.current) return;

    const particles = Registry.getByTag(Tag.PARTICLE);
    let count = 0;

    for (const p of particles) {
      const transform = p.getComponent<TransformComponent>('Transform');
      const identity = p.getComponent<IdentityComponent>('Identity');
      const life = p.getComponent<LifetimeComponent>('Lifetime');
      
      if (!transform || !life) continue;

      if (count >= MAX_PARTICLES) break;

      tempObj.position.set(transform.x, transform.y, 0);
      const scale = life.remaining / life.total; 
      tempObj.scale.set(scale, scale, 1);
      
      // Use Identity variant as Hex Color
      tempColor.set(identity ? identity.variant : '#FFF');
      
      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(count, tempObj.matrix);
      meshRef.current.setColorAt(count, tempColor);
      count++;
    }

    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, MAX_PARTICLES]}>
      <meshBasicMaterial color="white" />
    </instancedMesh>
  );
};
