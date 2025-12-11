import { Tag } from '../core/ecs/types';
import { InstancedActor } from './common/InstancedActor';
import { LifetimeComponent } from '../components/data/LifetimeComponent';
import { AssetService } from '../assets/AssetService';
import * as THREE from 'three';

export const ParticleRenderer = () => {
  const geometry = AssetService.get<THREE.BufferGeometry>('GEO_PARTICLE');
  const material = AssetService.get<THREE.Material>('MAT_PARTICLE');

  return (
    <InstancedActor 
      tag={Tag.PARTICLE} 
      geometry={geometry} 
      material={material} 
      maxCount={1000}
      colorSource="identity"
      updateEntity={(e, obj, color) => {
         const life = e.getComponent<LifetimeComponent>('Lifetime');
         if (life) {
             const scale = life.remaining / life.total;
             obj.scale.setScalar(scale);
             const isInFront = (e.id as number) % 2 === 0;
             obj.position.z = isInFront ? 6.0 : 4.0;
         }
      }}
    />
  );
};
