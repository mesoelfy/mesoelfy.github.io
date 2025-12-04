import { useFrame, useThree } from '@react-three/fiber';
import { FXManager } from '../systems/FXManager';
import { MathUtils } from 'three';

export const ScreenShaker = () => {
  const { camera } = useThree();
  
  useFrame((state, delta) => {
    const trauma = FXManager.trauma;
    
    // Standard Decay
    FXManager.decay(delta);

    if (trauma > 0) {
      // "Shake" is trauma squared (Non-linear falloff)
      const shake = trauma * trauma;
      
      // Max offsets
      const maxAngle = 0.05; // Radians (~2.8 degrees)
      const maxOffset = 0.5; // World units
      
      // Perlin-ish noise using simple Math.random() for jitter
      // In a more complex setup we'd use SimplexNoise, but this is efficient
      const yaw = maxAngle * shake * (Math.random() * 2 - 1);
      const pitch = maxAngle * shake * (Math.random() * 2 - 1);
      const roll = maxAngle * shake * (Math.random() * 2 - 1);
      
      const offsetX = maxOffset * shake * (Math.random() * 2 - 1);
      const offsetY = maxOffset * shake * (Math.random() * 2 - 1);

      // Apply to Camera (Orthographic mainly cares about X/Y)
      camera.position.x = offsetX;
      camera.position.y = offsetY;
      camera.rotation.z = roll;
    } else {
      // Reset smoothly
      camera.position.x = MathUtils.lerp(camera.position.x, 0, delta * 10);
      camera.position.y = MathUtils.lerp(camera.position.y, 0, delta * 10);
      camera.rotation.z = MathUtils.lerp(camera.rotation.z, 0, delta * 10);
    }
  });

  return null;
};
