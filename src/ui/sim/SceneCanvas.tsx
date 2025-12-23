'use client';

import { Canvas } from '@react-three/fiber';
import { WireframeFloor } from '@/ui/sim/vfx/WireframeFloor';
import { Suspense, useState } from 'react';
import { clsx } from 'clsx';

interface SceneCanvasProps {
  children?: React.ReactNode;
  className?: string;
}

export const SceneCanvas = ({ children, className }: SceneCanvasProps) => {
  const [ready, setReady] = useState(false);

  return (
    <div 
        // Wrapper: Always black, handles the "Fade In" logic from page.tsx via className
        className={clsx("fixed inset-0 w-full h-full z-0 pointer-events-none transition-all duration-[2000ms] ease-out bg-black", className)}
        style={{ backgroundColor: '#000000' }}
    >
      <Canvas 
        camera={{ position: [0, 2, 10], fov: 45 }}
        gl={{ antialias: true, alpha: false }} 
        dpr={[1, 2]}
        // Canvas Element: Force black bg, start invisible to prevent white flash
        style={{ background: '#000000', opacity: ready ? 1 : 0, transition: 'opacity 0.2s ease-in' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#000000', 1);
          // Defer visibility slightly to ensure first frame is drawn
          requestAnimationFrame(() => setReady(true));
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
