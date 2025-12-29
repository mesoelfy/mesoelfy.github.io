import * as THREE from 'three';
import { AssetService } from './AssetService';
import { addBarycentricCoordinates, createHunterSpear } from '@/engine/math/GeometryUtils';
import { MaterialFactory } from '@/engine/graphics/MaterialFactory';
import { ShaderLib } from '@/engine/graphics/ShaderLib';
import { MATERIAL_IDS, GEOMETRY_IDS } from '@/engine/config/AssetKeys';
import { ENEMIES } from '@/engine/config/defs/Enemies';
import { WEAPONS } from '@/engine/config/defs/Weapons';
import { EnemyTypes, WeaponIDs } from '@/engine/config/Identifiers';
import { Uniforms } from '@/engine/graphics/Uniforms';

export const registerAllAssets = () => {
  // 1. Static Materials
  AssetService.registerGenerator(MATERIAL_IDS.ENEMY_BASE, () => MaterialFactory.create(MATERIAL_IDS.ENEMY_BASE, ShaderLib.presets.enemy));
  AssetService.registerGenerator(MATERIAL_IDS.PARTICLE, () => {
    const mat = MaterialFactory.create(MATERIAL_IDS.PARTICLE, ShaderLib.presets.particle);
    mat.blending = THREE.AdditiveBlending;
    mat.depthWrite = false;
    return mat;
  });
  AssetService.registerGenerator(MATERIAL_IDS.PLAYER, () => new THREE.MeshBasicMaterial({ color: 0xffffff }));
  
  // --- PROJECTILE MATERIALS ---
  
  // SPITTER (Player Default): 10% Distortion
  AssetService.registerGenerator(MATERIAL_IDS.PROJECTILE_PLAYER, () => {
      return MaterialFactory.create('MAT_SPITTER_PLAYER', {
          ...ShaderLib.presets.spitter_proto,
          uniforms: { [Uniforms.INTENSITY]: { value: 0.10 }, [Uniforms.SPEED]: { value: 2.0 } }
      });
  });

  // HUNTER (Enemy Sniper): 40% Distortion
  AssetService.registerGenerator(MATERIAL_IDS.PROJECTILE_HUNTER, () => {
      return MaterialFactory.create('MAT_SPITTER_HUNTER', {
          ...ShaderLib.presets.spitter_proto,
          uniforms: { [Uniforms.INTENSITY]: { value: 0.40 }, [Uniforms.SPEED]: { value: 3.0 } }
      });
  });

  // PURGE (Player Ultimate): 10% Distortion (Matches Spitter feel but independent)
  AssetService.registerGenerator(MATERIAL_IDS.PROJECTILE_PURGE, () => {
      return MaterialFactory.create('MAT_SPITTER_PURGE', {
          ...ShaderLib.presets.spitter_proto,
          uniforms: { [Uniforms.INTENSITY]: { value: 0.10 }, [Uniforms.SPEED]: { value: 2.5 } }
      });
  });

  // DAEMON/GENERIC ENEMY: 40% Distortion
  AssetService.registerGenerator(MATERIAL_IDS.PROJECTILE_ENEMY, () => {
      return MaterialFactory.create('MAT_SPITTER_ENEMY', {
          ...ShaderLib.presets.spitter_proto,
          uniforms: { [Uniforms.INTENSITY]: { value: 0.40 }, [Uniforms.SPEED]: { value: 3.0 } }
      });
  });

  // 2. Static Geometries
  AssetService.registerGenerator(GEOMETRY_IDS.PLAYER, () => new THREE.BoxGeometry(1, 1, 1));
  AssetService.registerGenerator(GEOMETRY_IDS.PARTICLE, () => new THREE.PlaneGeometry(0.3, 0.3));

  // 3. Dynamic Registration (Enemies)
  Object.values(ENEMIES).forEach(def => {
      const key = `GEO_${def.id.toUpperCase()}`;
      AssetService.registerGenerator(key, () => createEnemyGeometry(def.id, def.visual));
  });

  // 4. Dynamic Registration (Weapons)
  // SPITTER: Detail 5
  const geoSpitter = new THREE.IcosahedronGeometry(0.5, 5); 
  // HUNTER: Detail 10
  const geoHunter = new THREE.IcosahedronGeometry(0.5, 10); 
  // PURGE: Detail 5 (Consistent with Spitter but independent)
  const geoPurge = new THREE.IcosahedronGeometry(0.5, 5);
  // POTATO: Detail 0
  const lowPoly = new THREE.IcosahedronGeometry(0.5, 0); 

  Object.values(WEAPONS).forEach(def => {
      let highGeo = geoSpitter;
      
      // Explicit Assignments to lock in settings
      if (def.id === WeaponIDs.ENEMY_HUNTER) highGeo = geoHunter;
      else if (def.id === WeaponIDs.PLAYER_PURGE) highGeo = geoPurge;
      else if (def.tags.includes('ENEMY')) highGeo = geoHunter; // Default enemy fallback
      
      AssetService.registerGenerator(`GEO_${def.id}_HIGH`, () => highGeo.clone());
      AssetService.registerGenerator(`GEO_${def.id}_LOW`, () => lowPoly.clone());
      // Default to LOW for safety if mode unknown
      AssetService.registerGenerator(`GEO_${def.id}`, () => lowPoly.clone());
  });
};

const createEnemyGeometry = (id: string, visual: any) => {
    if (id === EnemyTypes.DRILLER) {
        const height = 0.64;
        const radius = 0.5; 
        const geo = new THREE.ConeGeometry(radius, height, 4);
        geo.translate(0, -height / 2, 0);
        return addBarycentricCoordinates(geo);
    }
    return createGeometry(visual);
};

const createGeometry = (visual: any) => {
    let geo;
    switch (visual.model) {
        case 'CONE': geo = new THREE.ConeGeometry(0.5, visual.height || 1, visual.segments || 4); break;
        case 'ICOSA': geo = new THREE.IcosahedronGeometry(visual.radius || 1, visual.detail || 0); break;
        case 'OCTA': geo = new THREE.OctahedronGeometry(visual.radius || 0.5, 0); break;
        case 'TETRA': geo = new THREE.TetrahedronGeometry(1, 0); break;
        case 'SPHERE': geo = new THREE.IcosahedronGeometry(1, 1); break;
        case 'CAPSULE': geo = new THREE.CylinderGeometry(0.5, 0.5, 1, 6); break;
        case 'CYLINDER': geo = new THREE.CylinderGeometry(0.5, 0.5, 1, 8); break;
        case 'TORUS': geo = new THREE.TorusGeometry(0.8, 0.2, 4, 8); break;
        case 'BOX': geo = new THREE.BoxGeometry(1, 1, 1); break;
        case 'CUSTOM_HUNTER': return createHunterSpear(); 
        default: geo = new THREE.BoxGeometry(1,1,1); break;
    }
    return addBarycentricCoordinates(geo);
};
