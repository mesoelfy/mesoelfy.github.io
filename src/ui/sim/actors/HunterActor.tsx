import { Tag } from '@/engine/ecs/types';
import { GAME_THEME } from '@/ui/sim/config/theme';
import { EnemyTypes } from '@/sys/config/Identifiers';
import { InstancedActor } from './InstancedActor';
import { IdentityData } from '@/sys/data/IdentityData';
import { AssetService } from '@/ui/sim/assets/AssetService';
import { ComponentType } from '@/engine/ecs/ComponentType';
import * as THREE from 'three';

export const HunterActor = () => {
  const geometry = AssetService.get<THREE.BufferGeometry>('GEO_HUNTER');
  const material = AssetService.get<THREE.Material>('MAT_ENEMY_BASE');

  return (
    <InstancedActor 
      tag={Tag.ENEMY}
      geometry={geometry}
      material={material}
      maxCount={100}
      baseColor={GAME_THEME.enemy.hunter}
      z={5.0}
      filter={e => e.getComponent<IdentityData>(ComponentType.Identity)?.variant === EnemyTypes.HUNTER}
    />
  );
};
