import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ServiceLocator } from '@/sys/services/ServiceLocator';
import { AssetService } from '@/game/assets/AssetService';
import { ParticleSystem } from '@/sys/systems/ParticleSystem';

export const ParticleActor = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Use generators from AssetService
  const geometry = useMemo(() => AssetService.get<THREE.BufferGeometry>('GEO_PARTICLE'), []);
  const material = useMemo(() => AssetService.get<THREE.Material>('MAT_PARTICLE'), []);

  // Reusable objects for the loop
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    if (!meshRef.current) return;

    let sys: ParticleSystem | null = null;
    try {
        sys = ServiceLocator.getParticleSystem() as ParticleSystem;
    } catch { return; }

    const count = sys.count;
    
    // Safety check
    if (count === 0) {
        meshRef.current.count = 0;
        return;
    }

    for (let i = 0; i < count; i++) {
        const x = sys.x[i];
        const y = sys.y[i];
        const life = sys.life[i];
        const maxLife = sys.maxLife[i];
        
        // Scaling Logic
        const scale = life / maxLife;
        dummy.position.set(x, y, 6.0); // Z=6.0 (In front of enemies)
        dummy.scale.set(scale, scale, 1);
        dummy.updateMatrix();
        
        meshRef.current.setMatrixAt(i, dummy.matrix);
        
        // Color Logic
        color.setRGB(sys.r[i], sys.g[i], sys.b[i]);
        meshRef.current.setColorAt(i, color);
    }

    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, material, 2000]} // Max 2000
      frustumCulled={false}
    />
  );
};
