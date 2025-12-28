import { IEntitySpawner, IEntityRegistry } from '@/engine/interfaces';
import { Entity } from '@/engine/ecs/Entity';
import { Tag, Faction, ParticleShape } from '@/engine/ecs/types';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { ARCHETYPES } from '@/engine/config/Archetypes';
import { ComponentRegistry } from '@/engine/ecs/ComponentRegistry';
import { ArchetypeIDs, ArchetypeID, WeaponIDs } from '@/engine/config/Identifiers';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { GEOMETRY_IDS, MATERIAL_IDS } from '@/engine/config/AssetKeys';

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
        // Deep merge data if possible, otherwise spread
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

  public spawnBullet(
      x: number, y: number, 
      vx: number, vy: number, 
      faction: Faction, 
      life: number, 
      damage: number = 1, 
      projectileId: ArchetypeID = WeaponIDs.PLAYER_RAILGUN, 
      ownerId?: number,
      visualOverrides?: { scaleX?: number, scaleY?: number, color?: string } // NEW
  ): Entity {
    let id = projectileId;
    if (projectileId === 'BULLET_PLAYER' as any) id = WeaponIDs.PLAYER_RAILGUN;
    if (projectileId === 'BULLET_ENEMY' as any) id = WeaponIDs.ENEMY_HUNTER;
    
    const overrides: any = {
        [ComponentType.Transform]: { x, y, rotation: Math.atan2(vy, vx) }, 
        [ComponentType.Motion]: { vx, vy },
        [ComponentType.Lifetime]: { remaining: life, total: life },
        [ComponentType.Combat]: { damage },
        [ComponentType.Health]: { max: damage },
        [ComponentType.Projectile]: { configId: id, state: 'FLIGHT', ownerId: ownerId ?? -1 }
    };

    // Apply Visual Scaling if provided
    if (visualOverrides) {
        const transformData: any = {};
        if (visualOverrides.scaleX) transformData.baseScaleX = visualOverrides.scaleX;
        if (visualOverrides.scaleY) transformData.baseScaleY = visualOverrides.scaleY;
        overrides[ComponentType.RenderTransform] = transformData;

        if (visualOverrides.color) {
            // Hex parsing handled in RenderModel component logic usually, 
            // but here we might need to manually set it if the spawner doesn't auto-parse overrides.
            // ComponentRegistry.create handles the object, RenderModel.reset does copying.
            // RenderModel stores r,g,b. We need to pass those if we change color.
            // For now, we'll assume color overrides are handled via specific Archetypes or we add hex support to RenderModel.reset
        }
    }

    return this.spawn(id, overrides);
  }

  public spawnParticle(x: number, y: number, color: string, vx: number, vy: number, life: number, size: number = 1.0, shape: ParticleShape = ParticleShape.CIRCLE): void {
    const e = this.registry.createEntity();
    e.addTag(Tag.PARTICLE);
    e.addComponent(ComponentRegistry.create(ComponentType.Transform, { x, y, scale: size }));
    e.addComponent(ComponentRegistry.create(ComponentType.Motion, { vx, vy, friction: 0.05 }));
    e.addComponent(ComponentRegistry.create(ComponentType.Lifetime, { remaining: life, total: life }));
    e.addComponent(ComponentRegistry.create(ComponentType.Identity, { variant: color }));
    e.addComponent(ComponentRegistry.create(ComponentType.RenderModel, { geometryId: GEOMETRY_IDS.PARTICLE, materialId: MATERIAL_IDS.PARTICLE }));
    this.registry.updateCache(e);
  }
}
