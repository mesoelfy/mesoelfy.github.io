import { Tag } from '@/engine/ecs/types';
import { GAME_THEME } from '@/ui/sim/config/theme';
import { EnemyTypes } from '@/sys/config/Identifiers';
import { InstancedActor } from './InstancedActor';
import { IdentityData } from '@/sys/data/IdentityData';
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
      z={5.0}
      filter={e => e.getComponent<IdentityData>(ComponentType.Identity)?.variant === EnemyTypes.KAMIKAZE}
      updateEntity={(e, obj) => {
          // Kamikaze has unique rotation logic (tumble) that overrides the standard spin/aim behavior
          // We can keep specific overrides here if RenderData generic rotation isn't enough.
          // But actually, KamikazeLogic now writes to visualRotation, so standard works!
          // Only quirk: Kamikaze rotates on X/Y axes, standard handles Y. 
          // We'll leave it as standard for now, or minimal override.
      }}
    />
  );
};
