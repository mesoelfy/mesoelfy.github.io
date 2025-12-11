import { Tag } from '../core/ecs/types';
import { InstancedActor } from './common/InstancedActor';
import { HealthComponent } from '../components/data/HealthComponent';
import { AssetService } from '../assets/AssetService';

export const EnemyBulletRenderer = () => {
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
          // Scale based on Health (Mass)
          const hp = e.getComponent<HealthComponent>('Health');
          let scale = 1.0;
          
          if (hp) {
              scale = 0.4 + (0.6 * (hp.current / hp.max));
          }

          obj.rotation.set(0,0,0);
          obj.scale.setScalar(scale);
      }}
    />
  );
};
