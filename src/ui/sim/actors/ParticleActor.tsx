import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ServiceLocator } from '@/sys/services/ServiceLocator';
import { AssetService } from '@/ui/sim/assets/AssetService';
import { ParticleSystem } from '@/sys/systems/ParticleSystem';

const dummy = new THREE.Object3D();
const color = new THREE.Color();
const axisZ = new THREE.Vector3(0, 0, 1);

export const ParticleActor = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const geometry = useMemo(() => AssetService.get<THREE.BufferGeometry>('GEO_PARTICLE'), []);
  const material = useMemo(() => AssetService.get<THREE.Material>('MAT_PARTICLE'), []);

  useFrame(() => {
    if (!meshRef.current) return;

    let sys: ParticleSystem | null = null;
    try { sys = ServiceLocator.getParticleSystem() as ParticleSystem; } catch { return; }

    const count = sys.count;
    if (count === 0) {
        meshRef.current.count = 0;
        return;
    }

    for (let i = 0; i < count; i++) {
        const x = sys.x[i];
        const y = sys.y[i];
        const vx = sys.vx[i];
        const vy = sys.vy[i];
        const life = sys.life[i];
        const maxLife = sys.maxLife[i];
        
        dummy.position.set(x, y, 6.0);
        
        // --- STRETCH LOGIC ---
        // Calculate speed
        const speedSq = vx*vx + vy*vy;
        const speed = Math.sqrt(speedSq);
        
        // Base scale fades with life
        const lifeScale = life / maxLife;
        
        if (speed > 1.0) {
            // It's moving fast (like a laser part) -> Stretch it
            const angle = Math.atan2(vy, vx);
            dummy.rotation.set(0, 0, angle);
            
            // Stretch X based on speed, Shrink Y slightly
            dummy.scale.set(lifeScale * (1 + speed * 0.2), lifeScale * 0.5, 1);
        } else {
            // Stationary/Slow -> Normal square/dot
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(lifeScale, lifeScale, 1);
        }
        
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        
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
      args={[geometry, material, 2000]} 
      frustumCulled={false}
    />
  );
};
