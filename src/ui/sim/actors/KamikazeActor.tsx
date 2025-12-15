import { Tag } from '@/engine/ecs/types';
import { GAME_THEME } from '@/ui/sim/config/theme';
import { EnemyTypes } from '@/sys/config/Identifiers';
import { InstancedActor } from './InstancedActor';
import { IdentityData } from '@/sys/data/IdentityData';
import { AIStateData } from '@/sys/data/AIStateData';
import { AssetService } from '@/ui/sim/assets/AssetService';
import { ComponentType } from '@/engine/ecs/ComponentType';
import * as THREE from 'three';

export const KamikazeActor = () => {
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
      filter={e => e.getComponent<IdentityData>(ComponentType.Identity)?.variant === EnemyTypes.KAMIKAZE}
      updateEntity={(e, obj, color, delta) => {
          const state = e.getComponent<AIStateData>(ComponentType.State);
          const time = performance.now() * 0.001;
          obj.position.z = 5.0;
          
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
