import * as THREE from 'three';
import { AssetService } from './AssetService';
import { addBarycentricCoordinates, createHunterSpear } from '@/engine/math/GeometryUtils';
import { MODEL_CONFIG } from '@/engine/config/ModelConfig';
import { MaterialFactory } from '@/engine/graphics/MaterialFactory';
import { ShaderLib } from '@/engine/graphics/ShaderLib';
import { GEOMETRY_IDS, MATERIAL_IDS } from '@/engine/config/AssetKeys';

export const registerAllAssets = () => {
  AssetService.registerGenerator(MATERIAL_IDS.ENEMY_BASE, () => MaterialFactory.create(MATERIAL_IDS.ENEMY_BASE, ShaderLib.presets.enemy));
  AssetService.registerGenerator(MATERIAL_IDS.PARTICLE, () => {
    const mat = MaterialFactory.create(MATERIAL_IDS.PARTICLE, ShaderLib.presets.particle);
    mat.blending = THREE.AdditiveBlending;
    mat.depthWrite = false;
    return mat;
  });
  AssetService.registerGenerator(MATERIAL_IDS.PLAYER, () => new THREE.MeshBasicMaterial({ color: 0xffffff }));
  AssetService.registerGenerator(MATERIAL_IDS.PROJECTILE, () => new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));

  AssetService.registerGenerator(GEOMETRY_IDS.HUNTER, () => createHunterSpear());
  AssetService.registerGenerator(GEOMETRY_IDS.DRILLER, () => addBarycentricCoordinates(new THREE.ConeGeometry(0.5, MODEL_CONFIG.DRILLER.height, MODEL_CONFIG.DRILLER.segments)));
  AssetService.registerGenerator(GEOMETRY_IDS.KAMIKAZE, () => addBarycentricCoordinates(new THREE.IcosahedronGeometry(MODEL_CONFIG.KAMIKAZE.radius, 0)));
  AssetService.registerGenerator(GEOMETRY_IDS.DAEMON, () => new THREE.OctahedronGeometry(0.6, 0));
  AssetService.registerGenerator(GEOMETRY_IDS.PRJ_SPHERE, () => new THREE.IcosahedronGeometry(1, 1));
  AssetService.registerGenerator(GEOMETRY_IDS.PRJ_CAPSULE, () => new THREE.CylinderGeometry(0.5, 0.5, 1, 6));
  AssetService.registerGenerator(GEOMETRY_IDS.PRJ_DIAMOND, () => new THREE.OctahedronGeometry(1, 0));
  AssetService.registerGenerator(GEOMETRY_IDS.PRJ_PYRAMID, () => new THREE.TetrahedronGeometry(1, 0));
  AssetService.registerGenerator(GEOMETRY_IDS.PRJ_RING, () => new THREE.TorusGeometry(0.8, 0.2, 4, 8));
  AssetService.registerGenerator(GEOMETRY_IDS.PRJ_ARROW, () => new THREE.ConeGeometry(0.5, 1, 4));
  AssetService.registerGenerator(GEOMETRY_IDS.PARTICLE, () => new THREE.PlaneGeometry(0.3, 0.3));
  AssetService.registerGenerator(GEOMETRY_IDS.PLAYER, () => new THREE.BoxGeometry(1, 1, 1));

  // --- CHEVRON GENERATOR ---
  AssetService.registerGenerator(GEOMETRY_IDS.PRJ_CHEVRON, () => {
      const shape = new THREE.Shape();
      const w = 0.8; 
      const h = 0.8; 
      const t = 0.3; // Thickness of the V arms
      
      shape.moveTo(0, h);           // Tip
      shape.lineTo(w, -h);          // Right Bottom Outer
      shape.lineTo(w - t, -h);      // Right Bottom Inner
      shape.lineTo(0, h - (t*2.5)); // Crotch (Inner V point)
      shape.lineTo(-(w - t), -h);   // Left Bottom Inner
      shape.lineTo(-w, -h);         // Left Bottom Outer
      shape.lineTo(0, h);           // Back to Tip

      const extrudeSettings = { depth: 0.2, bevelEnabled: false };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.center(); // Center pivot
      // Rotate to point forward (Up in Y is forward in our game logic usually, but Extrude implies Z depth)
      // Actually standard rotation logic handles Y-up orientation well.
      return geo;
  });
};
