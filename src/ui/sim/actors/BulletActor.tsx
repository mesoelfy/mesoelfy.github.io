import { Tag } from '@/engine/ecs/types';
import { InstancedActor } from './InstancedActor';
import { HealthData } from '@/sys/data/HealthData';
import { AssetService } from '@/ui/sim/assets/AssetService';
import { TransformData } from '@/sys/data/TransformData';
import * as THREE from 'three';

export const BulletActor = () => {
  const geometry = AssetService.get<THREE.BufferGeometry>('GEO_BULLET_PLAYER');
  const material = AssetService.get<THREE.Material>('MAT_BULLET_PLAYER');

  return (
    <InstancedActor 
      tag={Tag.BULLET} 
      geometry={geometry} 
      material={material} 
      maxCount={500} 
      filter={(e) => !e.hasTag(Tag.ENEMY)}
      updateEntity={(e, obj) => {
         const transform = e.getComponent<TransformData>('Transform');
         const hp = e.getComponent<HealthData>('Health');
         
         let hpScale = 1.0;
         if (hp && hp.max > 1) {
             hpScale = 0.6 + (0.4 * (hp.current / hp.max));
         }
         
         const widthScale = transform ? transform.scale : 1.0;
         obj.scale.set(widthScale * hpScale, 1.5 * hpScale, 1); 
         if (transform) obj.rotation.z = transform.rotation - (Math.PI / 2);
      }}
    />
  );
};
