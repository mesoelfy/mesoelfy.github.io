'use client';

import { Canvas } from '@react-three/fiber';
import { PlayerAvatar } from './components/PlayerAvatar';
import { GameDirector } from './components/GameDirector';
import { EnemyRenderer } from './components/EnemyRenderer';
import { BulletRenderer } from './components/BulletRenderer';
import { EnemyBulletRenderer } from './components/EnemyBulletRenderer';
import { HunterChargeRenderer } from './components/HunterChargeRenderer';
import { ParticleRenderer } from './components/ParticleRenderer';

export const GameOverlay = () => {
  return (
    <div className="fixed inset-0 z-50 w-full h-full pointer-events-none overflow-hidden">
      <Canvas
        orthographic
        camera={{ zoom: 40, position: [0, 0, 100] }}
        gl={{ 
          alpha: true, 
          antialias: true,
          stencil: false,
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
