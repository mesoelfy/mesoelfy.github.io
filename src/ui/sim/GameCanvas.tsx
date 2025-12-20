'use client';

import { Canvas } from '@react-three/fiber';
import { GameDirector } from './GameDirector';
import { CameraRig } from './vfx/CameraRig';
import { GalleryStage } from './stages/GalleryStage';
import { LabStage } from './stages/LabStage';
import { RenderDirector } from './RenderDirector';
import { VirtualJoystick } from '@/ui/kit/atoms/VirtualJoystick';
import { ActionButton } from '@/ui/kit/atoms/ActionButton';
import { useStore } from '@/engine/state/global/useStore';
import { useEffect, useState, useLayoutEffect } from 'react';
import { registerAllAssets } from '@/ui/sim/assets/AssetCatalog';
import { CAMERA_CONFIG } from '@/engine/config/CameraConfig';

export const GameOverlay = () => {
  const { bootState, sandboxView } = useStore();
  const isGallery = bootState === 'sandbox' && sandboxView === 'gallery';
  const isLab = bootState === 'sandbox' && sandboxView === 'lab';
  
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);

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
            orthographic={!isGallery && !isLab}
            camera={
                isGallery ? { position: [5, 5, 10], fov: 45 } : 
                isLab ? { position: [0, 0, 10], fov: 50 } :
                { zoom: CAMERA_CONFIG.BASE_ZOOM, position: [0, 0, 100] }
            }
            gl={{ 
              alpha: true, 
              antialias: true,
              stencil: false,
              powerPreference: "high-performance"
            }}
            eventSource={document.body}
            eventPrefix="client"
          >
            {isLab ? (
                <LabStage />
            ) : isGallery ? (
                <GalleryStage />
            ) : (
                <>
                    <GameDirector />
                    <CameraRig />
                    <RenderDirector />
                </>
            )}
          </Canvas>
        </div>
        
        {isMobile && !isGallery && !isLab && (
            <>
                <VirtualJoystick />
                <ActionButton />
            </>
        )}
    </>
  );
};
