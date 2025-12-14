import { Tag } from '@/engine/ecs/types';
import { InstancedActor } from './InstancedActor';
import { HealthData } from '@/sys/data/HealthData';
import { AssetService } from '@/game/assets/AssetService';

export const EnemyBulletActor = () => {
  const geometry = AssetService.get<THREE.BufferGeometry>('GEO_BULLET_ENEMY');
  const material = AssetService.get<THREE.Material>('MAT_BULLET_ENEMY');

  return (
    <InstancedActor 
      tag={Tag.BULLET} 
      geometry={geometry} 
      material={material} 
      maxCount={200}
      filter={(e) => e.hasTag(Tag.ENEMY)}
      updateEntity={(e, obj) => {
          const hp = e.getComponent<HealthData>('Health');
          let scale = 1.0;
          
          if (hp) {
              const ratio = hp.current / hp.max;
              // MATCHED: Max Scale is now 1.5 to match HunterChargeRenderer
              // Range: 0.6 (Damaged) -> 1.5 (Full)
              scale = 0.6 + (0.9 * ratio);
          }

          obj.rotation.set(0,0,0);
          obj.scale.setScalar(scale);
      }}
    />
  );
};
