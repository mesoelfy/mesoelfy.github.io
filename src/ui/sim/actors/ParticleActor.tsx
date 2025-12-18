import { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { AssetService } from '@/ui/sim/assets/AssetService';
import { ParticleSystem } from '@/engine/systems/ParticleSystem';

const dummy = new THREE.Object3D();
const color = new THREE.Color();
const MAX_PARTICLES = 20000;

// Deterministic random to prevent jittering Z every frame, 
// since we rebuild particles every frame based on index.
const getZDepth = (index: number) => {
    // Hashes index to float between -2.0 and 2.0
    // This distributes particles in volume "around" the z=0 plane.
    const h = (index * 9301 + 49297) % 233280;
    const norm = h / 233280; // 0..1
    return (norm * 4.0) - 2.0; 
};

export const ParticleActor = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => AssetService.get<THREE.BufferGeometry>('GEO_PARTICLE'), []);
  const material = useMemo(() => AssetService.get<THREE.Material>('MAT_PARTICLE'), []);

  useLayoutEffect(() => {
      if (meshRef.current) {
          meshRef.current.geometry.setAttribute('shapeID', new THREE.InstancedBufferAttribute(new Float32Array(MAX_PARTICLES), 1));
      }
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    let sys: ParticleSystem | null = null;
    try { sys = ServiceLocator.getParticleSystem() as ParticleSystem; } catch { return; }

    const count = sys.count;
    if (count === 0) { meshRef.current.count = 0; return; }
    const shapeAttr = meshRef.current.geometry.getAttribute('shapeID') as THREE.InstancedBufferAttribute;

    for (let i = 0; i < count; i++) {
        const x = sys.x[i]; const y = sys.y[i]; const vx = sys.vx[i]; const vy = sys.vy[i];
        const life = sys.life[i]; const maxLife = sys.maxLife[i];
        const baseSize = sys.size[i]; const shape = sys.shape[i];
        
        // Volumetric Z-distribution
        const zDepth = getZDepth(i);
        
        dummy.position.set(x, y, zDepth);
        const speedSq = vx*vx + vy*vy;
        const speed = Math.sqrt(speedSq);
        const lifeScale = life / maxLife;
        
        if (speed > 1.0) {
            const angle = Math.atan2(vy, vx);
            dummy.rotation.set(0, 0, angle);
            const stretchMult = shape === 1 ? 0.3 : 0.2;
            const scaleX = lifeScale * baseSize * (1 + speed * stretchMult);
            const scaleY = lifeScale * baseSize * 0.5;
            dummy.scale.set(scaleX, scaleY, 1);
            const shift = (0.3 * scaleX) * 0.5;
            dummy.position.x += Math.cos(angle) * shift;
            dummy.position.y += Math.sin(angle) * shift;
        } else {
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(lifeScale * baseSize, lifeScale * baseSize, 1);
        }
        
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        color.setRGB(sys.r[i], sys.g[i], sys.b[i]);
        meshRef.current.setColorAt(i, color);
        shapeAttr.setX(i, shape);
    }

    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    shapeAttr.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, MAX_PARTICLES]} frustumCulled={false} />
  );
};
