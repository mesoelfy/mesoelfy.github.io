import { useFrame, useThree } from '@react-three/fiber';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { ShakeSystem } from '@/engine/systems/ShakeSystem';

export const CameraRig = () => {
  const { camera } = useThree();
  
  useFrame(() => {
    try {
        const sys = ServiceLocator.getSystem<ShakeSystem>('ShakeSystem');
        const { x, y, r } = sys.currentOffset;

        // Apply shake offset
        // We use the raw values calculated by ShakeSystem.
        camera.position.x = x;
        camera.position.y = y;
        camera.rotation.z = r;
        
    } catch {
        // System not ready yet
    }
  });

  return null;
};
