// This file runs INSIDE the Web Worker.
// It acts as the "GameDirector" for the off-screen world.

import { WorkerMessage, WorkerMessageType } from './messages';
import { GameBootstrapper } from '@/sys/services/GameBootstrapper';
import { GameEngineCore } from '@/sys/services/GameEngine';
import { TransformStore } from '@/engine/ecs/TransformStore';
import { ServiceLocator } from '@/sys/services/ServiceLocator';
import { InputSystem } from '@/sys/systems/InputSystem';

let engine: GameEngineCore | null = null;
let lastTime = 0;

// Loop
const gameLoop = (time: number) => {
  if (!engine) return;
  
  const delta = (time - lastTime) / 1000;
  lastTime = time;

  // 1. Run Logic
  engine.update(delta, time / 1000);

  // 2. Snapshot State
  // We copy the active portion of the TransformStore to send to Main
  // Optimization: In a real "SharedArrayBuffer" setup, we wouldn't copy.
  // Here we copy to ensure thread safety without SAB requirements.
  const snapshot = new Float32Array(TransformStore.data);

  // 3. Send to Main
  self.postMessage({
    type: WorkerMessageType.FRAME,
    payload: {
      transforms: snapshot,
      activeCount: engine.registry.getStats().active
    }
  }, [snapshot.buffer]); // Transfer ownership for zero-copy transmission

  requestAnimationFrame(gameLoop);
};

self.onmessage = (e: MessageEvent) => {
  const msg = e.data as WorkerMessage;

  switch (msg.type) {
    case WorkerMessageType.INIT:
      engine = GameBootstrapper();
      lastTime = performance.now();
      gameLoop(lastTime);
      break;

    case WorkerMessageType.INPUT:
      try {
        const input = ServiceLocator.getSystem<InputSystem>('InputSystem');
        input.updateCursor(msg.payload.x, msg.payload.y);
      } catch {}
      break;

    case WorkerMessageType.RESIZE:
      if (engine) {
        engine.updateViewport(msg.payload.width, msg.payload.height, 0, 0); // Approx
      }
      break;
  }
};
