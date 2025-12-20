import { InstancedActor } from './InstancedActor';
import { AssetService } from '@/ui/sim/assets/AssetService';
import { Tag } from '@/engine/ecs/types';
import { GEOMETRY_IDS } from '@/engine/config/AssetKeys';
import * as THREE from 'three';

const KEYS = [
    GEOMETRY_IDS.PRJ_SPHERE, 
    GEOMETRY_IDS.PRJ_CAPSULE, 
    GEOMETRY_IDS.PRJ_DIAMOND, 
    GEOMETRY_IDS.PRJ_PYRAMID, 
    GEOMETRY_IDS.PRJ_RING, 
    GEOMETRY_IDS.PRJ_ARROW,
    GEOMETRY_IDS.PRJ_CHEVRON // NEW
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
