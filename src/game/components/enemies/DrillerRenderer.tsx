import { Tag } from '@/game/core/ecs/types';
import { GAME_THEME } from '@/game/theme';
import { EnemyTypes } from '@/game/config/Identifiers';
import { InstancedActor } from '../common/InstancedActor';
import { IdentityComponent } from '@/game/components/data/IdentityComponent';
import { StateComponent } from '@/game/components/data/StateComponent';
import { TransformComponent } from '@/game/components/data/TransformComponent'; 
import { AssetService } from '@/game/assets/AssetService';
import { applyRotation } from '@/game/utils/RenderUtils';
import * as THREE from 'three';

export const DrillerRenderer = () => {
  const geometry = AssetService.get<THREE.BufferGeometry>('GEO_DRILLER');
  const material = AssetService.get<THREE.Material>('MAT_ENEMY_BASE');

  return (
    <InstancedActor 
      tag={Tag.ENEMY}
      geometry={geometry}
      material={material}
      maxCount={500}
      baseColor={GAME_THEME.enemy.muncher}
      colorSource="base" 
      filter={e => e.getComponent<IdentityComponent>('Identity')?.variant === EnemyTypes.DRILLER}
      updateEntity={(e, obj, color, delta) => {
          const state = e.getComponent<StateComponent>('State');
          const transform = e.getComponent<TransformComponent>('Transform');
          
          const speed = (state && state.current === 'DRILLING') ? 20.0 : 5.0;
          const spin = performance.now() * 0.001 * speed;
          const aim = transform ? transform.rotation : 0;
          
          obj.position.z = 5.0;
          applyRotation(obj, spin, aim);
          
          // Spawn Effect
          if (state && state.current === 'SPAWN') {
              const progress = 1.0 - (state.timers.spawn / 1.5);
              const eased = Math.pow(progress, 2); 
              obj.scale.setScalar(eased);
              obj.position.x += (Math.random() - 0.5) * 0.1 * (1-progress);
          } else {
              obj.scale.setScalar(1.0); 
          }
      }}
    />
  );
};
