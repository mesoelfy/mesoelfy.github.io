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
      AssetService.registerGenerator(key, () => createGeometry(def.visual));
  });
};

const createEnemyGeometry = (id: string, visual: any) => {
    if (id === EnemyTypes.DRILLER) {
        // FIXED: Restore bulk (Radius 0.5) and keep Y-Axis alignment for correct spinning
        const height = 0.64;
        const radius = 0.5; // Restored size
        
        const geo = new THREE.ConeGeometry(radius, height, 4);
        
        // Translate Tip to Origin (0,0,0)
        // Default Cone: Center 0,0,0. Tip at +height/2. Base at -height/2.
        // We move Down on Y by height/2 to bring Tip to 0.
        // Now: Tip at 0, Body extends down to -height.
        geo.translate(0, -height / 2, 0);
        
        return addBarycentricCoordinates(geo);
    }
    return createGeometry(visual);
};

const createGeometry = (visual: any) => {
    switch (visual.model) {
        // Legacy fallback: Use 0.5 radius default if not specified, matching old code behavior
        case 'CONE': return addBarycentricCoordinates(new THREE.ConeGeometry(0.5, visual.height || 1, visual.segments || 4));
        case 'ICOSA': return addBarycentricCoordinates(new THREE.IcosahedronGeometry(visual.radius || 1, visual.detail || 0));
        case 'OCTA': return new THREE.OctahedronGeometry(visual.radius || 0.5, 0);
        case 'TETRA': return new THREE.TetrahedronGeometry(1, 0);
        case 'SPHERE': return new THREE.IcosahedronGeometry(1, 1);
        case 'CAPSULE': return new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
        case 'CYLINDER': return new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
        case 'TORUS': return new THREE.TorusGeometry(0.8, 0.2, 4, 8);
        case 'BOX': return new THREE.BoxGeometry(1, 1, 1);
        case 'CUSTOM_HUNTER': return createHunterSpear();
        case 'CUSTOM_CHEVRON': {
            const shape = new THREE.Shape();
            const w = 0.8, h = 0.8, t = 0.3;
            shape.moveTo(0, h); shape.lineTo(w, -h); shape.lineTo(w - t, -h);
            shape.lineTo(0, h - (t*2.5)); shape.lineTo(-(w - t), -h); shape.lineTo(-w, -h); shape.lineTo(0, h);
            const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false });
            geo.center();
            return geo;
        }
        default: return new THREE.BoxGeometry(1,1,1);
    }
};
