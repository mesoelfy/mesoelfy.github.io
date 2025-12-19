import * as THREE from 'three';
import { AssetService } from './AssetService';
import { addBarycentricCoordinates } from '@/engine/math/GeometryUtils';
import { MODEL_CONFIG } from '@/engine/config/ModelConfig';
import { MaterialFactory } from '@/engine/graphics/MaterialFactory';
import { ShaderLib } from '@/engine/graphics/ShaderLib';
import { GEOMETRY_IDS, MATERIAL_IDS } from '@/engine/config/AssetKeys';

export const registerAllAssets = () => {
  // --- MATERIALS ---
  
  AssetService.registerGenerator(MATERIAL_IDS.ENEMY_BASE, () => {
    return MaterialFactory.create(MATERIAL_IDS.ENEMY_BASE, ShaderLib.presets.enemy);
  });

  AssetService.registerGenerator(MATERIAL_IDS.PARTICLE, () => {
    const mat = MaterialFactory.create(MATERIAL_IDS.PARTICLE, ShaderLib.presets.particle);
    mat.blending = THREE.AdditiveBlending;
    mat.depthWrite = false;
    return mat;
  });

  AssetService.registerGenerator(MATERIAL_IDS.PLAYER, () => new THREE.MeshBasicMaterial({ color: 0xffffff }));
  
  // Projectiles now use a shared basic neon material but colored via vertex attributes
  AssetService.registerGenerator(MATERIAL_IDS.PROJECTILE, () => new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));

  // --- GEOMETRY ---

  // Async Hunter Placeholder
  const hunterPlaceholder = addBarycentricCoordinates(new THREE.ConeGeometry(0.5, 2, 4));
  AssetService.generateAsyncGeometry(GEOMETRY_IDS.HUNTER, GEOMETRY_IDS.HUNTER, hunterPlaceholder);

  // Enemies
  AssetService.registerGenerator(GEOMETRY_IDS.DRILLER, () => addBarycentricCoordinates(new THREE.ConeGeometry(0.5, MODEL_CONFIG.DRILLER.height, MODEL_CONFIG.DRILLER.segments)));
  AssetService.registerGenerator(GEOMETRY_IDS.KAMIKAZE, () => addBarycentricCoordinates(new THREE.IcosahedronGeometry(MODEL_CONFIG.KAMIKAZE.radius, 0)));
  AssetService.registerGenerator(GEOMETRY_IDS.DAEMON, () => new THREE.OctahedronGeometry(0.6, 0));
  
  // Bullets
  AssetService.registerGenerator(GEOMETRY_IDS.PRJ_SPHERE, () => new THREE.IcosahedronGeometry(1, 1));
  AssetService.registerGenerator(GEOMETRY_IDS.PRJ_CAPSULE, () => new THREE.CylinderGeometry(0.5, 0.5, 1, 6));
  AssetService.registerGenerator(GEOMETRY_IDS.PRJ_DIAMOND, () => new THREE.OctahedronGeometry(1, 0));
  AssetService.registerGenerator(GEOMETRY_IDS.PRJ_PYRAMID, () => new THREE.TetrahedronGeometry(1, 0));
  AssetService.registerGenerator(GEOMETRY_IDS.PRJ_RING, () => new THREE.TorusGeometry(0.8, 0.2, 4, 8));
  AssetService.registerGenerator(GEOMETRY_IDS.PRJ_ARROW, () => new THREE.ConeGeometry(0.5, 1, 4));
  
  // Misc
  AssetService.registerGenerator(GEOMETRY_IDS.PARTICLE, () => new THREE.PlaneGeometry(0.3, 0.3));
  AssetService.registerGenerator(GEOMETRY_IDS.BULLET, () => new THREE.CylinderGeometry(0.1, 0.1, 1.0, 6)); // Legacy fallback
  AssetService.registerGenerator(GEOMETRY_IDS.PLAYER, () => new THREE.BoxGeometry(1, 1, 1));
};
