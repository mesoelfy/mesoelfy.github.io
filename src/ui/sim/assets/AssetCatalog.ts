import * as THREE from 'three';
import { AssetService } from './AssetService';
import { addBarycentricCoordinates } from '@/engine/math/GeometryUtils';
import { MODEL_CONFIG } from '@/engine/config/ModelConfig';
import { MaterialFactory } from '@/engine/graphics/MaterialFactory';
import { ShaderLib } from '@/engine/graphics/ShaderLib';

export const registerAllAssets = () => {
  // --- MATERIALS ---
  
  AssetService.registerGenerator('MAT_ENEMY_BASE', () => {
    return MaterialFactory.create('MAT_ENEMY_BASE', ShaderLib.presets.enemy);
  });

  AssetService.registerGenerator('MAT_PARTICLE', () => {
    const mat = MaterialFactory.create('MAT_PARTICLE', ShaderLib.presets.particle);
    mat.blending = THREE.AdditiveBlending;
    mat.depthWrite = false;
    return mat;
  });

  AssetService.registerGenerator('PLAYER_MAT', () => new THREE.MeshBasicMaterial({ color: 0xffffff }));

  // --- GEOMETRY ---

  // Async Hunter Placeholder
  const hunterPlaceholder = addBarycentricCoordinates(new THREE.ConeGeometry(0.5, 2, 4));
  AssetService.generateAsyncGeometry('GEO_HUNTER', 'GEO_HUNTER', hunterPlaceholder);

  // Procedural Geometries
  AssetService.registerGenerator('GEO_DRILLER', () => addBarycentricCoordinates(new THREE.ConeGeometry(0.5, MODEL_CONFIG.DRILLER.height, MODEL_CONFIG.DRILLER.segments)));
  
  // UPDATED: Now uses MODEL_CONFIG
  AssetService.registerGenerator('GEO_KAMIKAZE', () => addBarycentricCoordinates(new THREE.IcosahedronGeometry(MODEL_CONFIG.KAMIKAZE.radius, 0)));
  
  AssetService.registerGenerator('GEO_DAEMON', () => new THREE.OctahedronGeometry(0.6, 0));
  AssetService.registerGenerator('GEO_PARTICLE', () => new THREE.PlaneGeometry(0.3, 0.3));
  AssetService.registerGenerator('GEO_BULLET', () => new THREE.CylinderGeometry(0.1, 0.1, 1.0, 6));
  AssetService.registerGenerator('PLAYER_GEO', () => new THREE.BoxGeometry(1, 1, 1));
};
