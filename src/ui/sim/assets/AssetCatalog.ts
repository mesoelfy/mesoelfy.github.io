import * as THREE from 'three';
import { AssetService } from './AssetService';
import { addBarycentricCoordinates, createHunterSpear } from '@/engine/math/GeometryUtils';
import { MaterialFactory } from '@/engine/graphics/MaterialFactory';
import { ShaderLib } from '@/engine/graphics/ShaderLib';
import { MATERIAL_IDS, GEOMETRY_IDS } from '@/engine/config/AssetKeys';
import { ENEMIES } from '@/engine/config/defs/Enemies';
import { WEAPONS } from '@/engine/config/defs/Weapons';
import { EnemyTypes } from '@/engine/config/Identifiers';

export const registerAllAssets = () => {
  // Materials
  AssetService.registerGenerator(MATERIAL_IDS.ENEMY_BASE, () => MaterialFactory.create(MATERIAL_IDS.ENEMY_BASE, ShaderLib.presets.enemy));
  AssetService.registerGenerator(MATERIAL_IDS.PARTICLE, () => {
    const mat = MaterialFactory.create(MATERIAL_IDS.PARTICLE, ShaderLib.presets.particle);
    mat.blending = THREE.AdditiveBlending;
    mat.depthWrite = false;
    return mat;
  });
  AssetService.registerGenerator(MATERIAL_IDS.PLAYER, () => new THREE.MeshBasicMaterial({ color: 0xffffff }));
  AssetService.registerGenerator(MATERIAL_IDS.PROJECTILE, () => new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, side: THREE.DoubleSide }));

  // Basic Geo
  AssetService.registerGenerator(GEOMETRY_IDS.PLAYER, () => new THREE.BoxGeometry(1, 1, 1));
  AssetService.registerGenerator(GEOMETRY_IDS.PARTICLE, () => new THREE.PlaneGeometry(0.3, 0.3));

  // Enemies
  Object.values(ENEMIES).forEach(def => {
      const key = `GEO_${def.id.toUpperCase()}`;
      AssetService.registerGenerator(key, () => createEnemyGeometry(def.id, def.visual));
  });

  // --- WEAPONS (UNIFIED SPHERES) ---
  const sharedProjectileGeo = addBarycentricCoordinates(new THREE.SphereGeometry(0.5, 8, 8));
  
  Object.values(WEAPONS).forEach(def => {
      const key = `GEO_${def.id}`;
      // Force simple circle/sphere for all projectiles
      AssetService.registerGenerator(key, () => sharedProjectileGeo); 
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
        case 'CUSTOM_HUNTER': return createHunterSpear(); // RESTORED
        default: geo = new THREE.BoxGeometry(1,1,1); break;
    }
    return addBarycentricCoordinates(geo);
};
