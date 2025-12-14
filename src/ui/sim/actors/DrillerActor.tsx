import { Tag } from '@/engine/ecs/types';
import { GAME_THEME } from '@/game/theme';
import { EnemyTypes } from '@/sys/config/Identifiers';
import { InstancedActor } from './InstancedActor';
import { IdentityData } from '@/sys/data/IdentityData';
import { AIStateData } from '@/sys/data/AIStateData';
import { TransformData } from '@/sys/data/TransformData'; 
import { AssetService } from '@/game/assets/AssetService';
import { applyRotation } from '@/engine/math/RenderUtils';
import { useStore } from '@/sys/state/global/useStore';
import * as THREE from 'three';

export const DrillerActor = () => {
  const geometry = AssetService.get<THREE.BufferGeometry>('GEO_DRILLER');
  const material = AssetService.get<THREE.Material>('MAT_ENEMY_BASE');
  
  // Enable interaction if in mobile lockdown mode
  const isMobile = useStore(s => s.bootState === 'mobile_lockdown');

  return (
    <InstancedActor 
      tag={Tag.ENEMY}
      geometry={geometry}
      material={material}
      maxCount={500}
      baseColor={GAME_THEME.enemy.muncher}
      colorSource="base" 
      interactive={isMobile} // NEW: Pass the flag
      filter={e => e.getComponent<IdentityData>('Identity')?.variant === EnemyTypes.DRILLER}
      updateEntity={(e, obj, color, delta) => {
          const state = e.getComponent<AIStateData>('State');
          const transform = e.getComponent<TransformData>('Transform');
          
          const speed = (state && state.current === 'DRILLING') ? 20.0 : 5.0;
          const spin = performance.now() * 0.001 * speed;
          const aim = transform ? transform.rotation : 0;
          
          obj.position.z = 5.0;
          applyRotation(obj, spin, aim);
          
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
