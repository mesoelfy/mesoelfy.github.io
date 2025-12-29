import { InstancedActor } from './InstancedActor';
import { AssetService } from '@/ui/sim/assets/AssetService';
import { Tag } from '@/engine/ecs/types';
import { WEAPONS } from '@/engine/config/defs/Weapons';
import { useStore } from '@/engine/state/global/useStore';
import { MATERIAL_IDS } from '@/engine/config/AssetKeys';
import * as THREE from 'three';

export const ProjectileActor = () => {
  const graphicsMode = useStore(s => s.graphicsMode);
  
  const suffix = graphicsMode === 'HIGH' ? '_HIGH' : '_LOW';

  // Map weapons to their specific materials
  const renderItems = Object.values(WEAPONS).map(def => {
      // Fallback strings added to prevent runtime crash during HMR cycles
      let matKey = (MATERIAL_IDS && MATERIAL_IDS.PROJECTILE_PLAYER) || 'MAT_PROJECTILE_PLAYER';
      
      if (def.visual.material === 'PROJECTILE_ENEMY') {
          matKey = (MATERIAL_IDS && MATERIAL_IDS.PROJECTILE_ENEMY) || 'MAT_PROJECTILE_ENEMY';
      }
      else if (def.visual.material === 'PROJECTILE_HUNTER') {
          matKey = (MATERIAL_IDS && MATERIAL_IDS.PROJECTILE_HUNTER) || 'MAT_PROJECTILE_HUNTER';
      }

      return {
          baseId: def.id,
          geoKey: `GEO_${def.id}${suffix}`,
          // The renderKey MUST match what Spawner/RenderSystem uses to pack the buffer.
          renderKey: `GEO_${def.id}|${matKey}`,
          matKey: matKey
      };
  });

  return (
    <>
      {renderItems.map(item => (
        <InstancedActor
          key={item.baseId} 
          renderKey={item.renderKey}
          tag={Tag.PROJECTILE} 
          geometry={AssetService.get(item.geoKey)} 
          material={AssetService.get(item.matKey)} 
          maxCount={2000}
          interactive={false}
        />
      ))}
    </>
  );
};
