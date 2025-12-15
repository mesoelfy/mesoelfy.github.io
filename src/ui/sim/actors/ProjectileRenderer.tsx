import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ServiceLocator } from '@/sys/services/ServiceLocator';
import { TransformData } from '@/sys/data/TransformData';
import { RenderData } from '@/sys/data/RenderData';
import { ProjectileData } from '@/sys/data/ProjectileData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { PROJECTILE_CONFIG, GeometryType } from '@/sys/config/ProjectileConfig';
import { applyRotation } from '@/engine/math/RenderUtils';

const MAX_PER_TYPE = 1000;
const tempObj = new THREE.Object3D();
const tempColor = new THREE.Color();

// Reusable Material (Shared across all shapes)
// We use BasicMaterial because we want pure, unlit neon colors for Bloom.
const neonMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffffff,
    toneMapped: false // Critical for Bloom intensity > 1.0
});

export const ProjectileRenderer = () => {
  // Refs for each geometry bucket
  const sphereRef = useRef<THREE.InstancedMesh>(null);
  const capsuleRef = useRef<THREE.InstancedMesh>(null);
  const diamondRef = useRef<THREE.InstancedMesh>(null);
  const pyramidRef = useRef<THREE.InstancedMesh>(null);
  const ringRef = useRef<THREE.InstancedMesh>(null);
  const arrowRef = useRef<THREE.InstancedMesh>(null);

  // Geometry Definitions
  const geos = useMemo(() => ({
      SPHERE: new THREE.IcosahedronGeometry(1, 1),
      CAPSULE: new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
      DIAMOND: new THREE.OctahedronGeometry(1, 0),
      PYRAMID: new THREE.TetrahedronGeometry(1, 0),
      RING: new THREE.TorusGeometry(0.8, 0.2, 4, 8),
      ARROW: new THREE.ConeGeometry(0.5, 1, 4)
  }), []);

  // Pre-allocate Color Buffers
  useLayoutEffect(() => {
      const refs = [sphereRef, capsuleRef, diamondRef, pyramidRef, ringRef, arrowRef];
      refs.forEach(ref => {
          if (ref.current) {
              ref.current.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PER_TYPE * 3), 3);
          }
      });
  }, []);

  useFrame((state, delta) => {
    let registry;
    try { registry = ServiceLocator.getRegistry(); } catch { return; }

    // Counters for each bucket
    const counts: Record<GeometryType, number> = {
        SPHERE: 0, CAPSULE: 0, DIAMOND: 0, PYRAMID: 0, RING: 0, ARROW: 0
    };

    // References Map
    const refs: Record<GeometryType, THREE.InstancedMesh | null> = {
        SPHERE: sphereRef.current,
        CAPSULE: capsuleRef.current,
        DIAMOND: diamondRef.current,
        PYRAMID: pyramidRef.current,
        RING: ringRef.current,
        ARROW: arrowRef.current
    };

    const entities = registry.query({ all: [ComponentType.Projectile, ComponentType.Transform] });

    for (const entity of entities) {
        if (!entity.active) continue;

        const t = entity.getComponent<TransformData>(ComponentType.Transform);
        const p = entity.getComponent<ProjectileData>(ComponentType.Projectile);
        const r = entity.getComponent<RenderData>(ComponentType.Render);

        if (!t || !p) continue;

        const config = PROJECTILE_CONFIG[p.configId];
        if (!config) continue;

        const geoType = config.geometry;
        const mesh = refs[geoType];
        const index = counts[geoType];

        if (!mesh || index >= MAX_PER_TYPE) continue;

        // --- POSITION ---
        tempObj.position.set(t.x, t.y, 0);

        // --- ROTATION ---
        // 1. Base Rotation (from Spawner/Physics)
        // If faceVelocity is true, t.rotation is already set to direction of travel.
        // We need to align the model.
        // Cylinder/Cone default is Y-up. We want them pointing +X (0 radians).
        // So we rotate -PI/2 on Z.
        
        const alignOffset = -Math.PI / 2;
        let baseRotation = t.rotation + alignOffset;
        
        // 2. Visual Spin (RenderData)
        // If config has spin, we spin around the LOCAL Y axis of the mesh.
        const spin = r ? r.visualRotation : 0;
        
        // Use utility to combine "Facing Direction" with "Local Spin"
        applyRotation(tempObj, spin, t.rotation);

        // --- SCALE ---
        // Config Base * Transform Base * Visual Pulse
        const vScale = r?.visualScale || 1.0;
        tempObj.scale.set(
            config.scale[0] * t.scale * vScale,
            config.scale[1] * t.scale * vScale,
            config.scale[2] * t.scale * vScale
        );

        // --- COLOR ---
        // We ignore RenderData.r/g/b for base color because we want the Config's NEON values.
        // RenderData only provides 0-1 values usually.
        // We use the Config's HDR color array directly.
        
        tempColor.setRGB(config.color[0], config.color[1], config.color[2]);
        
        // Commit
        tempObj.updateMatrix();
        mesh.setMatrixAt(index, tempObj.matrix);
        mesh.setColorAt(index, tempColor);

        counts[geoType]++;
    }

    // Update all meshes
    Object.keys(refs).forEach((key) => {
        const k = key as GeometryType;
        const mesh = refs[k];
        if (mesh) {
            mesh.count = counts[k];
            if (mesh.instanceMatrix) mesh.instanceMatrix.needsUpdate = true;
            if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        }
    });
  });

  return (
    <>
        <instancedMesh ref={sphereRef} args={[geos.SPHERE, neonMaterial, MAX_PER_TYPE]} renderOrder={5} />
        <instancedMesh ref={capsuleRef} args={[geos.CAPSULE, neonMaterial, MAX_PER_TYPE]} renderOrder={5} />
        <instancedMesh ref={diamondRef} args={[geos.DIAMOND, neonMaterial, MAX_PER_TYPE]} renderOrder={5} />
        <instancedMesh ref={pyramidRef} args={[geos.PYRAMID, neonMaterial, MAX_PER_TYPE]} renderOrder={5} />
        <instancedMesh ref={ringRef} args={[geos.RING, neonMaterial, MAX_PER_TYPE]} renderOrder={5} />
        <instancedMesh ref={arrowRef} args={[geos.ARROW, neonMaterial, MAX_PER_TYPE]} renderOrder={5} />
    </>
  );
};
