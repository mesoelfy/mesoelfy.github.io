import { IEntitySpawner, IEntityRegistry } from '@/engine/interfaces';
import { Entity } from '@/engine/ecs/Entity';
import { Tag, Faction, ParticleShape } from '@/engine/ecs/types';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { ARCHETYPES } from '@/engine/config/Archetypes';
import { ComponentRegistry } from '@/engine/ecs/ComponentRegistry';
import { ArchetypeIDs } from '@/engine/config/Identifiers';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { PROJECTILE_CONFIG } from '@/engine/config/ProjectileConfig';
import { GEOMETRY_IDS, MATERIAL_IDS } from '@/engine/config/AssetKeys';
import { AutoRotate } from '@/engine/ecs/components/AutoRotate';

const GEO_MAP: Record<string, string> = {
    'SPHERE': GEOMETRY_IDS.PRJ_SPHERE,
    'CAPSULE': GEOMETRY_IDS.PRJ_CAPSULE,
    'DIAMOND': GEOMETRY_IDS.PRJ_DIAMOND,
    'PYRAMID': GEOMETRY_IDS.PRJ_PYRAMID,
    'RING': GEOMETRY_IDS.PRJ_RING,
    'ARROW': GEOMETRY_IDS.PRJ_ARROW,
    'CHEVRON': GEOMETRY_IDS.PRJ_CHEVRON
};

export class EntitySpawner implements IEntitySpawner {
  private registry: EntityRegistry;

  constructor(registry: IEntityRegistry) {
    this.registry = registry as EntityRegistry;
  }

  public spawn(archetypeId: string, overrides: Record<string, any> = {}, extraTags: Tag[] = []): Entity {
    const blueprint = ARCHETYPES[archetypeId];
    if (!blueprint) return this.registry.createEntity();

    const e = this.registry.createEntity();
    blueprint.tags.forEach(tag => e.addTag(tag));
    extraTags.forEach(tag => e.addTag(tag));

    for (const compDef of blueprint.components) {
        const blueprintData = JSON.parse(JSON.stringify(compDef.data || {}));
        const runtimeData = overrides[compDef.type] || {};
        const mergedData = { ...blueprintData, ...runtimeData };
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
  public spawnEnemy(type: string, x: number, y: number): Entity {
    return this.spawn(type, { [ComponentType.Transform]: { x, y } });
  }

  public spawnBullet(
      x: number, y: number, 
      vx: number, vy: number, 
      faction: Faction, 
      life: number, 
      damage: number = 1, 
      projectileId: string = 'PLAYER_STANDARD', 
      ownerId?: number
  ): Entity {
    const isEnemy = faction === Faction.HOSTILE;
    const id = isEnemy ? ArchetypeIDs.BULLET_ENEMY : ArchetypeIDs.BULLET_PLAYER;
    const rotation = Math.atan2(vy, vx);
    const config = PROJECTILE_CONFIG[projectileId];
    
    const color = config ? config.color : [1, 1, 1];
    const shape = config ? config.geometry : 'CAPSULE';
    const geoId = GEO_MAP[shape] || GEOMETRY_IDS.PRJ_CAPSULE;
    const s = config ? config.scale : [1,1,1]; 
    const pulseSpeed = config ? config.pulseSpeed : 0;

    const elasticity = projectileId === 'PLAYER_PURGE' ? 0.0 : 2.0;

    const overrides: Record<string, any> = {
        [ComponentType.Transform]: { x, y, rotation, scale: 1.0 }, 
        [ComponentType.Motion]: { vx, vy },
        [ComponentType.Lifetime]: { remaining: life, total: life },
        [ComponentType.Combat]: { damage },
        [ComponentType.Health]: { max: damage },
        [ComponentType.RenderModel]: {
            geometryId: geoId,
            materialId: MATERIAL_IDS.PROJECTILE,
            r: color[0], g: color[1], b: color[2],
        },
        [ComponentType.RenderTransform]: {
            scale: 1.0,
            baseScaleX: s[0], baseScaleY: s[1], baseScaleZ: s[2]
        },
        [ComponentType.RenderEffect]: { elasticity, pulseSpeed },
        [ComponentType.Projectile]: { configId: projectileId, state: 'FLIGHT', ownerId: ownerId ?? -1 }
    };
    
    const entity = this.spawn(id, overrides);

    if (config && config.spinSpeed !== 0) {
        entity.addComponent(new AutoRotate(config.spinSpeed));
    }

    return entity;
  }

  public spawnParticle(
      x: number, y: number, 
      color: string, 
      vx: number, vy: number, 
      life: number, 
      size: number = 1.0, 
      shape: ParticleShape = ParticleShape.CIRCLE
  ): void {
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
