'use client';

import { Canvas } from '@react-three/fiber';
import { PlayerAvatar } from './components/PlayerAvatar';
import { GameDirector } from './components/GameDirector';
import { EnemyRenderer } from './components/EnemyRenderer';
import { BulletRenderer } from './components/BulletRenderer';
import { EnemyBulletRenderer } from './components/EnemyBulletRenderer';
import { HunterChargeRenderer } from './components/HunterChargeRenderer';
import { ParticleRenderer } from './components/ParticleRenderer';
// Removed EffectsLayer due to React 19 incompatibility

export const GameOverlay = () => {
  return (
    // Z-Index 60: Above Panels (10), Below BreachOverlay (70) & Modals (100)
    <div className="fixed inset-0 z-[60] w-full h-full pointer-events-none overflow-hidden">
      <Canvas
        orthographic
        camera={{ zoom: 40, position: [0, 0, 100] }}
        gl={{ 
          alpha: true, 
          antialias: true,
          stencil: false,
          powerPreference: "high-performance"
        }}
        eventSource={typeof document !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
      >
        <GameDirector />

        <PlayerAvatar />
        
        <BulletRenderer />
        <HunterChargeRenderer /> 
        <EnemyBulletRenderer />
        <EnemyRenderer />
        <ParticleRenderer /> 
      </Canvas>
    </div>
  );
};
