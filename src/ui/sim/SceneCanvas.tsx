'use client';

import { Canvas } from '@react-three/fiber';
import { WireframeFloor } from '@/ui/sim/vfx/WireframeFloor';
import { Suspense } from 'react';
import { clsx } from 'clsx';

interface SceneCanvasProps {
  children?: React.ReactNode;
  className?: string;
}

export const SceneCanvas = ({ children, className }: SceneCanvasProps) => {
  return (
    <div 
        className={clsx("fixed inset-0 w-full h-full z-0 pointer-events-none transition-all duration-[2000ms] ease-out bg-black", className)}
        style={{ backgroundColor: '#000000' }}
    >
      <Canvas 
        camera={{ position: [0, 2, 10], fov: 45 }}
        gl={{ antialias: true, alpha: false }} 
        dpr={[1, 2]}
        style={{ background: '#000000' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#000000', 1);
        }}
      >
        <color attach="background" args={['#000']} />
        <fog attach="fog" args={['#000', 2, 30]} />
        <WireframeFloor />
        <ambientLight intensity={0.2} />
        <Suspense fallback={null}>
           {children}
        </Suspense>
      </Canvas>
    </div>
  );
};
