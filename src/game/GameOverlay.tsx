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
import { GalleryStage } from './components/GalleryStage'; // NEW
import { useStore } from '@/core/store/useStore';

export const GameOverlay = () => {
  const { bootState, sandboxView } = useStore();
  
  // LOGIC: If in Sandbox AND Gallery Mode -> Show Gallery Stage
  // Otherwise -> Show Standard Game Engine
  const isGallery = bootState === 'sandbox' && sandboxView === 'gallery';

  return (
    <div className="fixed inset-0 z-[60] w-full h-full pointer-events-none overflow-hidden">
      <Canvas
        orthographic={!isGallery} // Perspective cam for Gallery, Ortho for Game
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
  );
};
