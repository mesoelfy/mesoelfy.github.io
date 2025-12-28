import { PLAYER_CONFIG } from './PlayerConfig';
import { PhysicsConfig, CollisionLayers } from './PhysicsConfig';
import { ArchetypeIDs, WeaponIDs } from './Identifiers';
import { Tag } from '@/engine/ecs/types';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { GAME_THEME } from '@/ui/sim/config/theme';
import { GEOMETRY_IDS, MATERIAL_IDS } from './AssetKeys';
import { AI_STATE } from '@/engine/ai/AIStateTypes';
import { ENEMIES } from './defs/Enemies';
import { WEAPONS } from './defs/Weapons';

const parseHex = (hex: string) => {
    const c = parseInt(hex.replace('#', ''), 16);
    return { 
        r: ((c >> 16) & 255) / 255, 
        g: ((c >> 8) & 255) / 255, 
        b: (c & 255) / 255 
    };
};

const RenderComps = (geo: string, mat: string, colorHex: string, effectData: any = {}) => [
    { type: ComponentType.RenderModel, data: { geometryId: geo, materialId: mat, ...parseHex(colorHex) } },
    { type: ComponentType.RenderTransform, data: { scale: 1.0 } },
    { type: ComponentType.RenderEffect, data: { ...effectData } }
];

export interface EntityBlueprint {
  id: string;
  tags: Tag[];
  aiLogic?: string;
  assets?: { geometry: string; material: string; };
  components: { type: ComponentType; data?: any }[];
}

const BLUEPRINTS: Record<string, EntityBlueprint> = {
  // --- PLAYER (Manual) ---
  [ArchetypeIDs.PLAYER]: {
    id: ArchetypeIDs.PLAYER,
    tags: [Tag.PLAYER],
    components: [
      { type: ComponentType.Identity, data: { variant: 'PLAYER' } },
      { type: ComponentType.Transform, data: { x: 0, y: 0, rotation: 0, scale: 1 } },
      { type: ComponentType.Motion, data: { friction: 0.9 } },
      { type: ComponentType.Health, data: { max: PLAYER_CONFIG.maxHealth } },
      { type: ComponentType.State, data: { current: AI_STATE.IDLE } },
      { type: ComponentType.Collider, data: { 
          radius: PhysicsConfig.HITBOX.PLAYER, 
          layer: CollisionLayers.PLAYER, 
          mask: PhysicsConfig.MASKS.PLAYER 
      }},
      { type: ComponentType.StateColor, data: {
          base: GAME_THEME.turret.base,
          damaged: GAME_THEME.vfx.damage,
          dead: '#FF003C',
          repair: GAME_THEME.turret.repair,
          reboot: '#9E4EA5'
      }},
      ...RenderComps(GEOMETRY_IDS.PLAYER, MATERIAL_IDS.PLAYER, GAME_THEME.turret.base, { spawnProgress: 1.0 }) 
    ]
  }
};

// --- ENEMY GENERATION ---
Object.values(ENEMIES).forEach(def => {
    const geoId = `GEO_${def.id.toUpperCase()}`;
    const matId = 'MAT_ENEMY_BASE'; 
    
    const comps: any[] = [
      { type: ComponentType.Identity, data: { variant: def.id } },
      { type: ComponentType.Transform, data: { scale: 1.0 } },
      { type: ComponentType.Health, data: { max: def.health } },
      { type: ComponentType.Motion, data: { friction: def.physics.friction } },
      { type: ComponentType.Collider, data: { radius: def.physics.radius, layer: CollisionLayers.ENEMY, mask: PhysicsConfig.MASKS.ENEMY } },
      { type: ComponentType.State, data: { current: AI_STATE.SPAWN, timers: { spawn: 1.5 } } },
      // Enemies KEEP RenderEffect for spawn animation
      ...RenderComps(geoId, matId, def.visual.color, { elasticity: 0.1, spawnProgress: 0.0 }) 
    ];

    if (def.damage > 0) {
        comps.push({ type: ComponentType.Combat, data: { damage: def.damage } });
    }

    if (def.ai === 'daemon') {
        comps.push({ type: ComponentType.Orbital, data: { radius: 4.0, speed: 1.5, angle: 0 } });
        comps.push({ type: ComponentType.Target, data: { type: 'ENEMY' } });
        const col = comps.find((c: any) => c.type === ComponentType.Collider);
        if (col) {
            col.data.layer = CollisionLayers.PLAYER;
            col.data.mask = PhysicsConfig.MASKS.PLAYER;
        }
    } else {
        comps.push({ type: ComponentType.Target, data: { type: def.ai === 'driller' ? 'PANEL' : 'PLAYER' } });
    }

    BLUEPRINTS[def.id] = {
        id: def.id,
        tags: def.id === 'daemon' ? [Tag.PLAYER] : [Tag.ENEMY, Tag.OBSTACLE],
        aiLogic: def.ai,
        assets: { geometry: geoId, material: matId },
        components: comps
    };
});

// --- WEAPON GENERATION (FIXED) ---
Object.values(WEAPONS).forEach(def => {
    const geoId = `GEO_${def.id}`;
    const matId = 'MAT_PROJECTILE';
    const isEnemy = def.tags.includes(Tag.ENEMY);
    const layer = isEnemy ? CollisionLayers.ENEMY_PROJECTILE : CollisionLayers.PLAYER_PROJECTILE;
    const mask = isEnemy ? PhysicsConfig.MASKS.ENEMY_PROJECTILE : PhysicsConfig.MASKS.PLAYER_PROJECTILE;
    const radius = isEnemy ? PhysicsConfig.HITBOX.HUNTER_BULLET : PhysicsConfig.HITBOX.BULLET;

    const comps: any[] = [
      { type: ComponentType.Transform, data: { scale: 1.0 } },
      { type: ComponentType.Motion, data: { friction: 0 } },
      { type: ComponentType.Lifetime, data: { remaining: def.life, total: def.life } },
      { type: ComponentType.Combat, data: { damage: def.damage } },
      { type: ComponentType.Health, data: { max: def.damage } }, 
      { type: ComponentType.Collider, data: { radius, layer, mask } },
      { type: ComponentType.Projectile, data: { configId: def.id, state: 'FLIGHT' } },
      { type: ComponentType.RenderModel, data: { geometryId: geoId, materialId: matId, ...parseHex(def.visual.color) } },
      // NO RENDER EFFECT HERE. This ensures pure rigid body rendering.
      { type: ComponentType.RenderTransform, data: { 
          scale: 1.0, 
          baseScaleX: def.visual.scale[0], 
          baseScaleY: def.visual.scale[1], 
          baseScaleZ: def.visual.scale[2] 
      }}
    ];

    if (def.behavior?.spinSpeed) {
        comps.push({ type: ComponentType.AutoRotate, data: { speed: def.behavior.spinSpeed } });
    }
    
    BLUEPRINTS[def.id] = {
        id: def.id,
        tags: def.tags,
        components: comps
    };
});

if (BLUEPRINTS[WeaponIDs.PLAYER_RAILGUN]) {
    BLUEPRINTS[ArchetypeIDs.BULLET_PLAYER] = BLUEPRINTS[WeaponIDs.PLAYER_RAILGUN];
}
if (BLUEPRINTS[WeaponIDs.ENEMY_HUNTER]) {
    BLUEPRINTS[ArchetypeIDs.BULLET_ENEMY] = BLUEPRINTS[WeaponIDs.ENEMY_HUNTER];
}

export const ARCHETYPES = BLUEPRINTS;
