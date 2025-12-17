import { useMemo } from 'react';
import { InstancedActor } from './InstancedActor';
import { AssetService } from '@/ui/sim/assets/AssetService';
import { ARCHETYPES } from '@/engine/config/Archetypes';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { RenderData } from '@/engine/ecs/components/RenderData';
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
      if (!blueprint.tags.includes(Tag.ENEMY)) return;
      const renderDef = blueprint.components.find(c => c.type === ComponentType.Render);
      if (!renderDef || !renderDef.data) return;
      const { geometryId, materialId } = renderDef.data;
      if (!geometryId || !materialId) return;
      const key = `${geometryId}|${materialId}`;
      if (!uniqueGroups.has(key)) {
        try { uniqueGroups.set(key, { key, geometryId, materialId, geometry: AssetService.get(geometryId), material: AssetService.get(materialId) }); } catch {}
      }
    });
    return Array.from(uniqueGroups.values());
  }, []);

  return (
    <>
      {groups.map(group => (
        <InstancedActor
          key={group.key} tag={Tag.ENEMY} geometry={group.geometry} material={group.material} maxCount={500}
          filter={(entity) => { const render = entity.getComponent<RenderData>(ComponentType.Render); return render?.geometryId === group.geometryId && render?.materialId === group.materialId; }}
        />
      ))}
    </>
  );
};
