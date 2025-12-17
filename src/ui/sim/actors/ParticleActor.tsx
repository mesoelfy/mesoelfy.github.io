import { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { AssetService } from '@/ui/sim/assets/AssetService';
import { ParticleSystem } from '@/engine/systems/ParticleSystem';

const dummy = new THREE.Object3D();
const color = new THREE.Color();

// UPDATED: Must match ParticleSystem.ts
const MAX_PARTICLES = 20000;

export const ParticleActor = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const geometry = useMemo(() => AssetService.get<THREE.BufferGeometry>('GEO_PARTICLE'), []);
  const material = useMemo(() => AssetService.get<THREE.Material>('MAT_PARTICLE'), []);

  // Setup Attributes
  useLayoutEffect(() => {
      if (meshRef.current) {
          meshRef.current.geometry.setAttribute(
              'shapeID', 
              new THREE.InstancedBufferAttribute(new Float32Array(MAX_PARTICLES), 1)
          );
      }
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    let sys: ParticleSystem | null = null;
    try { sys = ServiceLocator.getParticleSystem() as ParticleSystem; } catch { return; }

    const count = sys.count;
    if (count === 0) {
        meshRef.current.count = 0;
        return;
    }

    const shapeAttr = meshRef.current.geometry.getAttribute('shapeID') as THREE.InstancedBufferAttribute;

    for (let i = 0; i < count; i++) {
        const x = sys.x[i];
        const y = sys.y[i];
        const vx = sys.vx[i];
        const vy = sys.vy[i];
        const life = sys.life[i];
        const maxLife = sys.maxLife[i];
        const baseSize = sys.size[i];
        const shape = sys.shape[i];
        
        // Z-DEPTH FIX: 
        // Driller is at Z=5.0. 
        // We alternate particles between Z=3.5 (Behind) and Z=6.5 (In Front).
        // This creates volume and prevents the "X-Ray" look where all sparks appear inside the mesh.
        const zDepth = (i % 2 === 0) ? 3.5 : 6.5;
        
        dummy.position.set(x, y, zDepth);
        
        const speedSq = vx*vx + vy*vy;
        const speed = Math.sqrt(speedSq);
        const lifeScale = life / maxLife;
        
        if (speed > 1.0) {
            const angle = Math.atan2(vy, vx);
            dummy.rotation.set(0, 0, angle);
            
            // Teardrop Stretch Logic
            const stretchMult = shape === 1 ? 0.3 : 0.2;
            const scaleX = lifeScale * baseSize * (1 + speed * stretchMult);
            const scaleY = lifeScale * baseSize * 0.5;
            
            dummy.scale.set(scaleX, scaleY, 1);

            // OVERSHOOT FIX: Pivot Correction
            const visualLength = 0.3 * scaleX; 
            const shift = visualLength * 0.5;

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
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, material, MAX_PARTICLES]} 
      frustumCulled={false}
    />
  );
};
