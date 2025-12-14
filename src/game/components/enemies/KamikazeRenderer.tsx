import { Tag } from '@/engine/ecs/types';
import { GAME_THEME } from '@/game/theme';
import { EnemyTypes } from '@/game/config/Identifiers';
import { InstancedActor } from '../common/InstancedActor';
import { IdentityComponent } from '@/game/components/data/IdentityComponent';
import { StateComponent } from '@/game/components/data/StateComponent';
import { AssetService } from '@/game/assets/AssetService';

export const KamikazeRenderer = () => {
  const geometry = AssetService.get<THREE.BufferGeometry>('GEO_KAMIKAZE');
  const material = AssetService.get<THREE.Material>('MAT_ENEMY_BASE');

  return (
    <InstancedActor 
      tag={Tag.ENEMY}
      geometry={geometry}
      material={material}
      maxCount={200}
      baseColor={GAME_THEME.enemy.kamikaze}
      colorSource="base"
      filter={e => e.getComponent<IdentityComponent>('Identity')?.variant === EnemyTypes.KAMIKAZE}
      updateEntity={(e, obj, color, delta) => {
          const state = e.getComponent<StateComponent>('State');
          const time = performance.now() * 0.001;
          obj.position.z = 5.0;
          
          // Kamikaze just tumbles chaotically
          obj.rotation.set(time * 2, time, 0); 
          
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
