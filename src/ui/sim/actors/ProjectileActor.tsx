import { InstancedActor } from './InstancedActor';
import { AssetService } from '@/ui/sim/assets/AssetService';
import { Tag } from '@/engine/ecs/types';
import * as THREE from 'three';

const KEYS = [
    'GEO_PRJ_SPHERE', 'GEO_PRJ_CAPSULE', 'GEO_PRJ_DIAMOND', 
    'GEO_PRJ_PYRAMID', 'GEO_PRJ_RING', 'GEO_PRJ_ARROW'
];

export const ProjectileActor = () => {
  const material = AssetService.get<THREE.Material>('MAT_PROJECTILE');

  return (
    <>
      {KEYS.map(key => (
        <InstancedActor
          key={key} 
          renderKey={`${key}|MAT_PROJECTILE`}
          tag={Tag.BULLET} 
          geometry={AssetService.get(key)} 
          material={material} 
          maxCount={2000}
          interactive={false}
        />
      ))}
    </>
  );
};
