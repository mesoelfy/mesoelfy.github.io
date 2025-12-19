import React, { createContext, useContext, ReactNode } from 'react';
import { 
  IAudioService, 
  IInputService, 
  IGameEventService, 
  IEntityRegistry, 
  IEntitySpawner, 
  IGameSystem 
} from '@/engine/interfaces';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { AudioServiceImpl } from '@/engine/audio/AudioService';
import { InputSystem } from '@/engine/systems/InputSystem';
import { GameEventService } from '@/engine/signals/GameEventBus';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { EntitySpawner } from '@/engine/services/EntitySpawner';

interface GameContextProps {
  audio: IAudioService;
  input: IInputService;
  events: IGameEventService;
  registry: IEntityRegistry;
  spawner: IEntitySpawner;
  // Generic accessor for specific systems (e.g. ShakeSystem)
  getSystem: <T extends IGameSystem>(id: string) => T | null;
}

// Fallbacks for initial render (before EngineFactory runs)
const mockRegistry = new EntityRegistry();
const mockSpawner = new EntitySpawner(mockRegistry);

const defaultContext: GameContextProps = {
  audio: new AudioServiceImpl(),
  input: new InputSystem(),
  events: new GameEventService(),
  registry: mockRegistry,
  spawner: mockSpawner,
  getSystem: () => null
};

const GameContext = createContext<GameContextProps>(defaultContext);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  // We grab references from ServiceLocator ONCE during provider mount.
  // This bridges the imperative Engine world to the declarative React world.
  
  let audio: IAudioService;
  let input: IInputService;
  let events: IGameEventService;
  let registry: IEntityRegistry;
  let spawner: IEntitySpawner;

  // Safe retrieval with fallbacks
  const safeGet = <T,>(id: string, fallback: T): T => {
      try { return ServiceLocator.get<T>(id); } catch { return fallback; }
  };

  audio = safeGet('AudioService', new AudioServiceImpl());
  input = safeGet('InputSystem', new InputSystem());
  events = safeGet('GameEventService', new GameEventService());
  registry = safeGet('EntityRegistry', mockRegistry);
  spawner = safeGet('EntitySpawner', mockSpawner);

  const getSystem = <T extends IGameSystem>(id: string): T | null => {
      try { return ServiceLocator.getSystem<T>(id); } catch { return null; }
  };

  return (
    <GameContext.Provider value={{ audio, input, events, registry, spawner, getSystem }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => useContext(GameContext);
