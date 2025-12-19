import { useFrame, useThree } from '@react-three/fiber';
import { useGameContext } from '@/engine/state/GameContext';
import { ShakeSystem } from '@/engine/systems/ShakeSystem';

export const CameraRig = () => {
  const { camera } = useThree();
  const { getSystem } = useGameContext();
  
  useFrame(() => {
    const sys = getSystem<ShakeSystem>('ShakeSystem');
    if (sys) {
        const { x, y, r } = sys.currentOffset;
        camera.position.x = x;
        camera.position.y = y;
        camera.rotation.z = r;
    }
  });

  return null;
};
