import { useMemo } from 'react';
import { InstancedActor } from './InstancedActor';
import { AssetService } from '@/ui/sim/assets/AssetService';
import { ARCHETYPES } from '@/game/config/Archetypes';
import { ComponentType } from '@/core/ecs/ComponentType';
import { RenderData } from '@/game/data/RenderData';
import { Tag } from '@/core/ecs/types';
import * as THREE from 'three';

interface RenderGroup {
  key: string;
  geometryId: string;
  materialId: string;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

export const UniversalActor = () => {
  // 1. Analyze Archetypes to find all unique Render Configurations
  const groups = useMemo(() => {
    const uniqueGroups = new Map<string, RenderGroup>();

    Object.values(ARCHETYPES).forEach(blueprint => {
      // We only care about Enemies for this generic renderer
      // (Player and Particles have their own specialized logic)
      if (!blueprint.tags.includes(Tag.ENEMY)) return;

      const renderDef = blueprint.components.find(c => c.type === ComponentType.Render);
      if (!renderDef || !renderDef.data) return;

      const { geometryId, materialId } = renderDef.data;
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
            console.warn(`[UniversalActor] Failed to load assets for ${key}`, e);
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
          tag={Tag.ENEMY}
          geometry={group.geometry}
          material={group.material}
          maxCount={500} // Shared pool limit per type
          filter={(entity) => {
             const render = entity.getComponent<RenderData>(ComponentType.Render);
             return render?.geometryId === group.geometryId && render?.materialId === group.materialId;
          }}
        />
      ))}
    </>
  );
};
