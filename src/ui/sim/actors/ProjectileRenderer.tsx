import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { RenderData } from '@/engine/ecs/components/RenderData';
import { ProjectileData } from '@/engine/ecs/components/ProjectileData';
import { MotionData } from '@/engine/ecs/components/MotionData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { PROJECTILE_CONFIG, GeometryType } from '@/engine/config/ProjectileConfig';
import { applyRotation } from '@/engine/math/RenderUtils';

const MAX_PER_TYPE = 1000;
const tempObj = new THREE.Object3D();
const tempColor = new THREE.Color();
const neonMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
const STRETCH_FACTOR = 0.08; 
const SQUASH_FACTOR = 0.04;
const MAX_STRETCH = 4.0;

export const ProjectileRenderer = () => {
  const sphereRef = useRef<THREE.InstancedMesh>(null);
  const capsuleRef = useRef<THREE.InstancedMesh>(null);
  const diamondRef = useRef<THREE.InstancedMesh>(null);
  const pyramidRef = useRef<THREE.InstancedMesh>(null);
  const ringRef = useRef<THREE.InstancedMesh>(null);
  const arrowRef = useRef<THREE.InstancedMesh>(null);

  const geos = useMemo(() => ({
      SPHERE: new THREE.IcosahedronGeometry(1, 1),
      CAPSULE: new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
      DIAMOND: new THREE.OctahedronGeometry(1, 0),
      PYRAMID: new THREE.TetrahedronGeometry(1, 0),
      RING: new THREE.TorusGeometry(0.8, 0.2, 4, 8),
      ARROW: new THREE.ConeGeometry(0.5, 1, 4)
  }), []);

  useLayoutEffect(() => {
      [sphereRef, capsuleRef, diamondRef, pyramidRef, ringRef, arrowRef].forEach(ref => {
          if (ref.current) ref.current.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PER_TYPE * 3), 3);
      });
  }, []);

  useFrame(() => {
    let registry;
    try { registry = ServiceLocator.getRegistry(); } catch { return; }
    const counts: Record<GeometryType, number> = { SPHERE: 0, CAPSULE: 0, DIAMOND: 0, PYRAMID: 0, RING: 0, ARROW: 0 };
    const refs: Record<GeometryType, THREE.InstancedMesh | null> = { SPHERE: sphereRef.current, CAPSULE: capsuleRef.current, DIAMOND: diamondRef.current, PYRAMID: pyramidRef.current, RING: ringRef.current, ARROW: arrowRef.current };
    const entities = registry.query({ all: [ComponentType.Projectile, ComponentType.Transform] });

    for (const entity of entities) {
        if (!entity.active) continue;
        const t = entity.getComponent<TransformData>(ComponentType.Transform);
        const p = entity.getComponent<ProjectileData>(ComponentType.Projectile);
        const r = entity.getComponent<RenderData>(ComponentType.Render);
        const m = entity.getComponent<MotionData>(ComponentType.Motion);
        if (!t || !p) continue;
        const config = PROJECTILE_CONFIG[p.configId];
        if (!config) continue;

        const mesh = refs[config.geometry];
        const index = counts[config.geometry];
        if (!mesh || index >= MAX_PER_TYPE) continue;

        tempObj.position.set(t.x, t.y, 0);
        applyRotation(tempObj, r ? r.visualRotation : 0, t.rotation);

        let stretchY = 1.0; let squashXZ = 1.0; 
        if (m) {
            const speed = Math.sqrt(m.vx*m.vx + m.vy*m.vy);
            if (speed > 1.0) { stretchY = Math.min(MAX_STRETCH, 1.0 + (speed * STRETCH_FACTOR)); squashXZ = Math.max(0.4, 1.0 - (speed * SQUASH_FACTOR)); }
        }
        const vScale = r?.visualScale || 1.0;
        tempObj.scale.set(config.scale[0] * t.scale * vScale * squashXZ, config.scale[1] * t.scale * vScale * stretchY, config.scale[2] * t.scale * vScale * squashXZ);

        if (r) tempColor.setRGB(r.r, r.g, r.b);
        else tempColor.setRGB(config.color[0], config.color[1], config.color[2]);
        
        tempObj.updateMatrix();
        mesh.setMatrixAt(index, tempObj.matrix);
        mesh.setColorAt(index, tempColor);
        counts[config.geometry]++;
    }

    Object.keys(refs).forEach((k) => {
        const mesh = refs[k as GeometryType];
        if (mesh) { mesh.count = counts[k as GeometryType]; if (mesh.instanceMatrix) mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; }
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
