'use client';

import { Canvas } from '@react-three/fiber';
import { GameDirector } from './components/GameDirector';
import { ScreenShaker } from './components/ScreenShaker';
import { GalleryStage } from './components/GalleryStage';
import { RenderDirector } from './components/RenderDirector';
import { VirtualJoystick } from '@/ui/atoms/VirtualJoystick';
import { ActionButton } from '@/ui/atoms/ActionButton';
import { useStore } from '@/core/store/useStore';
import { useEffect, useState } from 'react';

export const GameOverlay = () => {
  const { bootState, sandboxView } = useStore();
  const isGallery = bootState === 'sandbox' && sandboxView === 'gallery';
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
      setMounted(true);
      // Robust Mobile/Touch Detection
      const checkMobile = () => {
        const isCoarse = window.matchMedia('(pointer: coarse)').matches;
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        setIsMobile(isCoarse || isTouch);
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!mounted) return null;

  return (
    <>
        <div className="fixed inset-0 z-[60] w-full h-full pointer-events-none overflow-hidden">
          <Canvas
            orthographic={!isGallery}
            camera={isGallery ? { position: [5, 5, 10], fov: 45 } : { zoom: 40, position: [0, 0, 100] }}
            gl={{ 
              alpha: true, 
              antialias: true,
              stencil: false,
              powerPreference: "high-performance"
            }}
            eventSource={document.body}
            eventPrefix="client"
          >
            {isGallery ? (
                <GalleryStage />
            ) : (
                <>
                    {/* Infrastructure & Logic */}
                    <GameDirector />
                    <ScreenShaker />
                    
                    {/* Visual Entities */}
                    <RenderDirector />
                </>
            )}
          </Canvas>
        </div>
        
        {/* Mobile Controls Layer */}
        {isMobile && !isGallery && (
            <>
                <VirtualJoystick />
                <ActionButton />
            </>
        )}
    </>
  );
};
