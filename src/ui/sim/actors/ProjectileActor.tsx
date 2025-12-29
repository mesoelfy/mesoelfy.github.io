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
      let matKey = MATERIAL_IDS.PROJECTILE_PLAYER;
      
      if (def.visual.material === 'PROJECTILE_ENEMY') {
          matKey = MATERIAL_IDS.PROJECTILE_ENEMY;
      }

      return {
          baseId: def.id,
          geoKey: `GEO_${def.id}${suffix}`,
          // The renderKey MUST match what Spawner/RenderSystem uses to pack the buffer.
          // Spawner uses the Material ID defined in Archetypes.
          // Archetypes.ts maps visual.material string to the actual material ID.
          // So we reconstruct the key: GeometryID|MaterialID
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
