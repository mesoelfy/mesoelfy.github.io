import { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ServiceLocator } from '@/sys/services/ServiceLocator';
import { AssetService } from '@/ui/sim/assets/AssetService';
import { ParticleSystem } from '@/sys/systems/ParticleSystem';

const dummy = new THREE.Object3D();
const color = new THREE.Color();

export const ParticleActor = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const geometry = useMemo(() => AssetService.get<THREE.BufferGeometry>('GEO_PARTICLE'), []);
  const material = useMemo(() => AssetService.get<THREE.Material>('MAT_PARTICLE'), []);

  // Setup Attributes
  useLayoutEffect(() => {
      if (meshRef.current) {
          // Max particles matches ParticleSystem constant (2000)
          const max = 2000;
          meshRef.current.geometry.setAttribute(
              'shapeID', 
              new THREE.InstancedBufferAttribute(new Float32Array(max), 1)
          );
      }
  }, []);

  useFrame(() => {
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
        
        dummy.position.set(x, y, 6.0);
        
        const speedSq = vx*vx + vy*vy;
        const speed = Math.sqrt(speedSq);
        const lifeScale = life / maxLife;
        
        if (speed > 1.0) {
            const angle = Math.atan2(vy, vx);
            dummy.rotation.set(0, 0, angle);
            
            // For Teardrop (Shape 1), we want more length stretch
            const stretchMult = shape === 1 ? 0.3 : 0.2;
            
            dummy.scale.set(
                lifeScale * baseSize * (1 + speed * stretchMult), 
                lifeScale * baseSize * 0.5, 
                1
            );
        } else {
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(lifeScale * baseSize, lifeScale * baseSize, 1);
        }
        
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        
        color.setRGB(sys.r[i], sys.g[i], sys.b[i]);
        meshRef.current.setColorAt(i, color);
        
        // Update Shape Attribute
        shapeAttr.setX(i, shape);
    }

    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    
    // Important: Flag attribute for upload
    shapeAttr.needsUpdate = true;
  });

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, material, 2000]} 
      frustumCulled={false}
    />
  );
};
