import { Tag } from '@/engine/ecs/types';
import { GAME_THEME } from '@/ui/sim/config/theme';
import { EnemyTypes } from '@/sys/config/Identifiers';
import { InstancedActor } from './InstancedActor';
import { IdentityData } from '@/sys/data/IdentityData';
import { AssetService } from '@/ui/sim/assets/AssetService';
import { useStore } from '@/sys/state/global/useStore';
import { ComponentType } from '@/engine/ecs/ComponentType';
import * as THREE from 'three';

export const DrillerActor = () => {
  const geometry = AssetService.get<THREE.BufferGeometry>('GEO_DRILLER');
  const material = AssetService.get<THREE.Material>('MAT_ENEMY_BASE');
  const isMobile = useStore(s => s.bootState === 'mobile_lockdown');

  return (
    <InstancedActor 
      tag={Tag.ENEMY}
      geometry={geometry}
      material={material}
      maxCount={500}
      baseColor={GAME_THEME.enemy.muncher}
      interactive={isMobile}
      z={5.0} // Explicit Z depth
      filter={e => e.getComponent<IdentityData>(ComponentType.Identity)?.variant === EnemyTypes.DRILLER}
      // No updateEntity needed! RenderData handles spin/color.
    />
  );
};
