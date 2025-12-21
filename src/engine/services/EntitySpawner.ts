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
        console.error(`[EntitySpawner] Archetype not found: ${archetypeId}`);
        return this.registry.createEntity();
    }

    const e = this.registry.createEntity();
    
    // 1. Tags
    blueprint.tags.forEach(tag => e.addTag(tag));
    extraTags.forEach(tag => e.addTag(tag));

    // 2. Components (Merge Blueprint Data with Runtime Overrides)
    for (const compDef of blueprint.components) {
        const blueprintData = compDef.data || {};
        const runtimeData = overrides[compDef.type] || {};
        
        // Shallow merge is usually sufficient for flat component data
        const mergedData = { ...blueprintData, ...runtimeData };
        
        e.addComponent(ComponentRegistry.create(compDef.type, mergedData));
    }

    // 3. Asset Metadata (Legacy support for old rendering systems)
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
      projectileId: ArchetypeID = WeaponIDs.PLAYER_STANDARD, 
      ownerId?: number
  ): Entity {
    // Map abstract faction types to specific IDs if generic provided
    let id = projectileId;
    if (projectileId === 'BULLET_PLAYER' as any) id = WeaponIDs.PLAYER_STANDARD;
    if (projectileId === 'BULLET_ENEMY' as any) id = WeaponIDs.ENEMY_HUNTER;

    // Calculate rotation based on velocity
    const rotation = Math.atan2(vy, vx);

    // Prepare Runtime Overrides
    // We ONLY set what is dynamic. Visuals, Colliders, Elasticity etc come from the Archetype.
    const overrides: Record<string, any> = {
        [ComponentType.Transform]: { x, y, rotation }, 
        [ComponentType.Motion]: { vx, vy },
        [ComponentType.Lifetime]: { remaining: life, total: life },
        [ComponentType.Combat]: { damage },
        [ComponentType.Health]: { max: damage },
        [ComponentType.Projectile]: { configId: id, state: 'FLIGHT', ownerId: ownerId ?? -1 }
    };
    
    // Spawn using the Blueprint
    return this.spawn(id, overrides);
  }

  public spawnParticle(
      x: number, y: number, 
      color: string, 
      vx: number, vy: number, 
      life: number, 
      size: number = 1.0, 
      shape: ParticleShape = ParticleShape.CIRCLE
  ): void {
    // Particles are transient and simple, so we construct them manually to avoid overhead of Archetype lookup
    // (Though we could make a PARTICLE archetype, direct creation is faster for high-frequency low-logic entities)
    const e = this.registry.createEntity();
    e.addTag(Tag.PARTICLE);
    
    e.addComponent(ComponentRegistry.create(ComponentType.Transform, { x, y, scale: size }));
    e.addComponent(ComponentRegistry.create(ComponentType.Motion, { vx, vy, friction: 0.05 }));
    e.addComponent(ComponentRegistry.create(ComponentType.Lifetime, { remaining: life, total: life }));
    e.addComponent(ComponentRegistry.create(ComponentType.Identity, { variant: color }));
    
    e.addComponent(ComponentRegistry.create(ComponentType.RenderModel, {
        geometryId: GEOMETRY_IDS.PARTICLE,
        materialId: MATERIAL_IDS.PARTICLE
    }));
    
    this.registry.updateCache(e);
  }
}
