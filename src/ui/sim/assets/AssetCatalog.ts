import * as THREE from 'three';
import { AssetService } from './AssetService';
import { addBarycentricCoordinates, createHunterSpear } from '@/engine/math/GeometryUtils';
import { MaterialFactory } from '@/engine/graphics/MaterialFactory';
import { ShaderLib } from '@/engine/graphics/ShaderLib';
import { MATERIAL_IDS, GEOMETRY_IDS } from '@/engine/config/AssetKeys';
import { ENEMIES } from '@/engine/config/defs/Enemies';
import { WEAPONS } from '@/engine/config/defs/Weapons';
import { EnemyTypes } from '@/engine/config/Identifiers';
import { Uniforms } from '@/engine/graphics/Uniforms';
import { PALETTE } from '@/engine/config/Palette';

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
  
  // Projectile Materials
  
  // Player: 25% Distortion
  AssetService.registerGenerator(MATERIAL_IDS.PROJECTILE_PLAYER, () => {
      return MaterialFactory.create('MAT_SPITTER_PLAYER', {
          ...ShaderLib.presets.spitter_proto,
          uniforms: {
              [Uniforms.INTENSITY]: { value: 0.25 }, 
              [Uniforms.SPEED]: { value: 2.0 }
          }
      });
  });

  // Enemy Generic: 60% Distortion
  AssetService.registerGenerator(MATERIAL_IDS.PROJECTILE_ENEMY, () => {
      return MaterialFactory.create('MAT_SPITTER_ENEMY', {
          ...ShaderLib.presets.spitter_proto,
          uniforms: {
              [Uniforms.INTENSITY]: { value: 0.60 }, 
              [Uniforms.SPEED]: { value: 3.0 }
          }
      });
  });

  // NEW: Hunter Projectile Energy Shader
  AssetService.registerGenerator(MATERIAL_IDS.PROJECTILE_HUNTER, () => {
      return MaterialFactory.create(MATERIAL_IDS.PROJECTILE_HUNTER, {
          ...ShaderLib.presets.hunter_energy,
          uniforms: {
              [Uniforms.COLOR]: { value: new THREE.Color(PALETTE.ORANGE.PRIMARY) },
              [Uniforms.INTENSITY]: { value: 0.5 }, // Base distortion
              [Uniforms.SPEED]: { value: 1.0 },
              uFresnelPower: { value: 2.25 }, // 45%
              uNoiseStr: { value: 0.8 },      // 80%
              uCoreOpacity: { value: 0.8 }    // 80%
          }
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
  const spitterHigh = new THREE.IcosahedronGeometry(0.5, 1); 
  const hunterHigh = new THREE.IcosahedronGeometry(0.5, 12); 
  const lowPoly = new THREE.IcosahedronGeometry(0.5, 0); 

  Object.values(WEAPONS).forEach(def => {
      const isEnemy = def.tags.includes('ENEMY');
      
      AssetService.registerGenerator(`GEO_${def.id}_HIGH`, () => isEnemy ? hunterHigh.clone() : spitterHigh.clone());
      AssetService.registerGenerator(`GEO_${def.id}_LOW`, () => lowPoly.clone());
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
