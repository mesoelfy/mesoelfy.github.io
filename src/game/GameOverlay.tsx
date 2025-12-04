'use client';

import { Canvas } from '@react-three/fiber';
import { PlayerTurret } from './components/PlayerTurret';
import { GameDirector } from './components/GameDirector';
import { EnemyRenderer } from './components/EnemyRenderer';
import { BulletRenderer } from './components/BulletRenderer';
import { ParticleRenderer } from './components/ParticleRenderer'; // <-- NEW

export const GameOverlay = () => {
  return (
    <div className="fixed inset-0 z-50 w-full h-full pointer-events-none overflow-hidden">
      <Canvas
        orthographic
        camera={{ zoom: 40, position: [0, 0, 100] }}
        gl={{ alpha: true, antialias: true }}
        eventSource={typeof document !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
      >
        <GameDirector />

        <PlayerTurret />
        <BulletRenderer />
        <EnemyRenderer />
        <ParticleRenderer /> 
      </Canvas>
    </div>
  );
};
