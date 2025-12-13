'use client';

import { Canvas } from '@react-three/fiber';
import { GameDirector } from './components/GameDirector';
import { ScreenShaker } from './components/ScreenShaker';
import { GalleryStage } from './components/GalleryStage';
import { RenderDirector } from './components/RenderDirector';
import { VirtualJoystick } from '@/ui/atoms/VirtualJoystick';
import { ActionButton } from '@/ui/atoms/ActionButton';
import { useStore } from '@/core/store/useStore';
import { useEffect, useState, useLayoutEffect } from 'react';
import { registerAllAssets } from './assets/AssetCatalog';

export const GameOverlay = () => {
  const { bootState, sandboxView } = useStore();
  const isGallery = bootState === 'sandbox' && sandboxView === 'gallery';
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);

  // 1. Initialize Assets IMMEDIATELY before Canvas can mount
  useLayoutEffect(() => {
      registerAllAssets();
      setAssetsReady(true);
  }, []);

  useEffect(() => {
      setMounted(true);
      const checkMobile = () => {
        const isCoarse = window.matchMedia('(pointer: coarse)').matches;
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        setIsMobile(isCoarse || isTouch);
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!mounted || !assetsReady) return null;

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
                    {/* Logic Core */}
                    <GameDirector />
                    
                    {/* Visuals */}
                    <ScreenShaker />
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
