'use client';

import { Canvas } from '@react-three/fiber';
import { PlayerAvatar } from './components/PlayerAvatar';
import { GameDirector } from './components/GameDirector';
import { EnemyRenderer } from './components/EnemyRenderer';
import { BulletRenderer } from './components/BulletRenderer';
import { EnemyBulletRenderer } from './components/EnemyBulletRenderer';
import { HunterChargeRenderer } from './components/HunterChargeRenderer';
import { ParticleRenderer } from './components/ParticleRenderer';
import { ScreenShaker } from './components/ScreenShaker';
import { ProjectileTrails } from './components/ProjectileTrails'; 
import { GalleryStage } from './components/GalleryStage';
import { VirtualJoystick } from '@/ui/atoms/VirtualJoystick'; // NEW
import { useStore } from '@/core/store/useStore';
import { useEffect, useState } from 'react';

export const GameOverlay = () => {
  const { bootState, sandboxView } = useStore();
  const isGallery = bootState === 'sandbox' && sandboxView === 'gallery';
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
      // Simple touch detection
      const onTouch = () => setIsTouch(true);
      window.addEventListener('touchstart', onTouch, { once: true });
      return () => window.removeEventListener('touchstart', onTouch);
  }, []);

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
            eventSource={typeof document !== 'undefined' ? document.body : undefined}
            eventPrefix="client"
          >
            {isGallery ? (
                <GalleryStage />
            ) : (
                <>
                    <GameDirector />
                    <ScreenShaker />
                    <ProjectileTrails />
                    <PlayerAvatar />
                    <BulletRenderer />
                    <HunterChargeRenderer /> 
                    <EnemyBulletRenderer />
                    <EnemyRenderer />
                    <ParticleRenderer /> 
                </>
            )}
          </Canvas>
        </div>
        
        {/* Show Joystick if Touch is detected AND we are in Game Mode (not Gallery) */}
        {isTouch && !isGallery && <VirtualJoystick />}
    </>
  );
};
