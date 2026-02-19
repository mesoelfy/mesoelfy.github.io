import { IEntitySpawner, IEntityRegistry } from '@/engine/interfaces';
import { Entity } from '@/engine/ecs/Entity';
import { Tag, Faction } from '@/engine/ecs/types';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { ARCHETYPES } from '@/engine/config/Archetypes';
import { ComponentRegistry } from '@/engine/ecs/ComponentRegistry';
import { ArchetypeIDs, ArchetypeID, WeaponIDs } from '@/engine/config/Identifiers';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class EntitySpawner implements IEntitySpawner {
  private registry: EntityRegistry;
  constructor(registry: IEntityRegistry) {
    this.registry = registry as EntityRegistry;
  }

  public spawn(archetypeId: ArchetypeID, overrides: Record<string, any> = {}, extraTags: Tag[] = []): Entity {
    const blueprint = ARCHETYPES[archetypeId];
    if (!blueprint) {
        console.error(`ERR_NO_ARCHETYPE: ${archetypeId}`);
        return this.registry.createEntity();
    }
    const e = this.registry.createEntity();
    blueprint.tags.forEach(tag => e.addTag(tag));
    extraTags.forEach(tag => e.addTag(tag));

    for (const compDef of blueprint.components) {
        const mergedData = { ...(compDef.data || {}), ...(overrides[compDef.type] || {}) };
        e.addComponent(ComponentRegistry.create(compDef.type, mergedData));
    }

    if (blueprint.assets) {
        const render: any = e.getComponent(ComponentType.RenderModel);
        if (render) {
            render.geometryId = blueprint.assets.geometry;
            render.materialId = blueprint.assets.material;
        }
    }
    this.registry.updateCache(e);
    return e;
  }

  public spawnPlayer(): Entity { return this.spawn(ArchetypeIDs.PLAYER); }
  public spawnEnemy(type: ArchetypeID, x: number, y: number): Entity {
    return this.spawn(type, { [ComponentType.Transform]: { x, y } });
  }

  public spawnProjectile(
      x: number, y: number, 
      vx: number, vy: number, 
      faction: Faction, 
      life: number, 
      damage: number = 1, 
      projectileId: ArchetypeID = WeaponIDs.PLAYER_SPITTER,
      ownerId?: number,
      visualOverrides?: { scaleX?: number, scaleY?: number, color?: string }
  ): Entity {
    let id = projectileId;
    if (projectileId === 'BULLET_PLAYER' as any) id = WeaponIDs.PLAYER_SPITTER;
    if (projectileId === 'BULLET_ENEMY' as any) id = WeaponIDs.ENEMY_HUNTER;
    
    const overrides: any = {
        [ComponentType.Transform]: { x, y, rotation: Math.atan2(vy, vx) }, 
        [ComponentType.Motion]: { vx, vy, friction: 0 }, 
        [ComponentType.Lifetime]: { remaining: life, total: life },
        [ComponentType.Combat]: { damage },
        [ComponentType.Health]: { max: damage },
        [ComponentType.Projectile]: { configId: id, state: 'FLIGHT', ownerId: ownerId ?? -1 }
    };

    if (visualOverrides) {
        const transformData: any = {};
        if (visualOverrides.scaleX) transformData.baseScaleX = visualOverrides.scaleX;
        if (visualOverrides.scaleY) transformData.baseScaleY = visualOverrides.scaleY;
        overrides[ComponentType.RenderTransform] = transformData;
    }

    const entity = this.spawn(id, overrides);
    
    return entity;
  }
}
