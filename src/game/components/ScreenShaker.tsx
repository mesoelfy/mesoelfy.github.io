import { useFrame, useThree } from '@react-three/fiber';
import { ServiceLocator } from '../core/ServiceLocator';
import { CameraSystem } from '../systems/CameraSystem';
import * as THREE from 'three';

export const ScreenShaker = () => {
  const { camera } = useThree();
  
  useFrame(() => {
    try {
        const sys = ServiceLocator.getSystem<CameraSystem>('CameraSystem');
        const { x, y, r } = sys.getShake();

        // Apply shake offset
        // Note: We assume camera stays at (0,0,100) base. 
        // If we add camera tracking later, we must add this offset to the target position.
        camera.position.x = x;
        camera.position.y = y;
        camera.rotation.z = r;
        
    } catch {
        // System not ready yet
    }
  });

  return null;
};
