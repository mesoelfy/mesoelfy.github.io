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
  // 1. Static Materials
  AssetService.registerGenerator(MATERIAL_IDS.ENEMY_BASE, () => MaterialFactory.create(MATERIAL_IDS.ENEMY_BASE, ShaderLib.presets.enemy));
  AssetService.registerGenerator(MATERIAL_IDS.PARTICLE, () => {
    const mat = MaterialFactory.create(MATERIAL_IDS.PARTICLE, ShaderLib.presets.particle);
    mat.blending = THREE.AdditiveBlending;
    mat.depthWrite = false;
    return mat;
  });
  AssetService.registerGenerator(MATERIAL_IDS.PLAYER, () => new THREE.MeshBasicMaterial({ color: 0xffffff }));
  AssetService.registerGenerator(MATERIAL_IDS.PROJECTILE, () => new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));

  // 2. Static Geometries
  AssetService.registerGenerator(GEOMETRY_IDS.PLAYER, () => new THREE.BoxGeometry(1, 1, 1));
  AssetService.registerGenerator(GEOMETRY_IDS.PARTICLE, () => new THREE.PlaneGeometry(0.3, 0.3));

  // 3. Dynamic Registration (Enemies)
  Object.values(ENEMIES).forEach(def => {
      const key = `GEO_${def.id.toUpperCase()}`;
      AssetService.registerGenerator(key, () => createEnemyGeometry(def.id, def.visual));
  });

  // 4. Dynamic Registration (Weapons)
  Object.values(WEAPONS).forEach(def => {
      const key = `GEO_${def.id}`;
      // Pass true for isProjectile
      AssetService.registerGenerator(key, () => createGeometry(def.visual, true)); 
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
    return createGeometry(visual, false);
};

const createGeometry = (visual: any, isProjectile: boolean = false) => {
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
        case 'CUSTOM_CHEVRON': {
            const shape = new THREE.Shape();
            const w = 0.8, h = 0.8, t = 0.3;
            shape.moveTo(0, h); shape.lineTo(w, -h); shape.lineTo(w - t, -h);
            shape.lineTo(0, h - (t*2.5)); shape.lineTo(-(w - t), -h); shape.lineTo(-w, -h); shape.lineTo(0, h);
            geo = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false });
            geo.center();
            break;
        }
        default: geo = new THREE.BoxGeometry(1,1,1); break;
    }

    // Offset Projectiles so origin is at the Tail (Bottom)
    // Projectiles align +Y to velocity. Scaling Y stretches them.
    // If centered (default), scaling Y stretches back and front.
    // Moving geometry UP (+Y) by half height puts Bottom at 0.
    // Then scaling Y grows UP (Forward).
    if (isProjectile) {
        if (visual.model === 'CAPSULE' || visual.model === 'CYLINDER' || visual.model === 'CONE') {
            geo.translate(0, 0.5, 0);
        } else if (visual.model === 'TETRA') {
            // Tetra is weird, usually centered. Let's shift it a bit.
            geo.translate(0, 0.3, 0);
        }
    }

    return addBarycentricCoordinates(geo);
};
