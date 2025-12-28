import { InstancedActor } from './InstancedActor';
import { AssetService } from '@/ui/sim/assets/AssetService';
import { Tag } from '@/engine/ecs/types';
import { WEAPONS } from '@/engine/config/defs/Weapons';
import * as THREE from 'three';

export const ProjectileActor = () => {
  const material = AssetService.get<THREE.Material>('MAT_PROJECTILE');

  // Generate keys based on the Weapons definition
  const renderKeys = Object.values(WEAPONS).map(def => `GEO_${def.id}`);

  return (
    <>
      {renderKeys.map(key => (
        <InstancedActor
          key={key} 
          renderKey={`${key}|MAT_PROJECTILE`}
          tag={Tag.PROJECTILE} 
          geometry={AssetService.get(key)} 
          material={material} 
          maxCount={2000}
          interactive={false}
        />
      ))}
    </>
  );
};
