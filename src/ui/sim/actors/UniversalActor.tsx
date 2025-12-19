import { useMemo } from 'react';
import { InstancedActor } from './InstancedActor';
import { AssetService } from '@/ui/sim/assets/AssetService';
import { ARCHETYPES } from '@/engine/config/Archetypes';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { Tag } from '@/engine/ecs/types';
import * as THREE from 'three';

interface RenderGroup {
  key: string;
  geometryId: string;
  materialId: string;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

export const UniversalActor = () => {
  const groups = useMemo(() => {
    const uniqueGroups = new Map<string, RenderGroup>();

    Object.values(ARCHETYPES).forEach(blueprint => {
      // 1. Only process Enemy tags
      if (!blueprint.tags.includes(Tag.ENEMY)) return;

      // 2. Resolve IDs (Check new 'assets' field, then fallback to component data)
      let geometryId = blueprint.assets?.geometry;
      let materialId = blueprint.assets?.material;

      if (!geometryId || !materialId) {
          const renderDef = blueprint.components.find(c => c.type === ComponentType.RenderModel);
          if (renderDef?.data) {
              geometryId = geometryId || renderDef.data.geometryId;
              materialId = materialId || renderDef.data.materialId;
          }
      }

      if (!geometryId || !materialId) return;

      const key = `${geometryId}|${materialId}`;
      if (!uniqueGroups.has(key)) {
        try { 
            uniqueGroups.set(key, { 
                key, 
                geometryId, 
                materialId, 
                geometry: AssetService.get(geometryId), 
                material: AssetService.get(materialId) 
            }); 
        } catch (e) {
            console.warn(`[UniversalActor] Failed to load assets for group: ${key}`, e);
        }
      }
    });

    return Array.from(uniqueGroups.values());
  }, []);

  return (
    <>
      {groups.map(group => (
        <InstancedActor
          key={group.key} 
          renderKey={group.key}
          tag={Tag.ENEMY} 
          geometry={group.geometry} 
          material={group.material} 
          maxCount={2000}
          interactive={true}
        />
      ))}
    </>
  );
};
