import React, { createContext, useContext, ReactNode, useMemo } from 'react';
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
  getSystem: <T extends IGameSystem>(id: string) => T | null;
}

// Fallbacks for SSR / Initial Mount
const mockRegistry = new EntityRegistry();
const mockSpawner = new EntitySpawner(mockRegistry);
const mockEvents = new GameEventService();
const mockInput = new InputSystem();
const mockAudio = new AudioServiceImpl();

const defaultContext: GameContextProps = {
  audio: mockAudio,
  input: mockInput,
  events: mockEvents,
  registry: mockRegistry,
  spawner: mockSpawner,
  getSystem: () => null
};

const GameContext = createContext<GameContextProps>(defaultContext);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  // CRITICAL ARCHITECTURE FIX:
  // We use getters to proxy calls to the ServiceLocator.
  // This ensures that when the Engine restarts (ServiceLocator.reset()),
  // React components immediately interact with the NEW instances
  // without needing a full context re-mount or forceUpdate.
  
  const contextValue = useMemo(() => ({
    get audio() { 
      try { return ServiceLocator.getAudioService(); } catch { return mockAudio; } 
    },
    get input() { 
      try { return ServiceLocator.getInputService(); } catch { return mockInput; } 
    },
    get events() { 
      try { return ServiceLocator.getGameEventBus(); } catch { return mockEvents; } 
    },
    get registry() { 
      try { return ServiceLocator.getRegistry(); } catch { return mockRegistry; } 
    },
    get spawner() { 
      try { return ServiceLocator.getSpawner(); } catch { return mockSpawner; } 
    },
    getSystem: <T extends IGameSystem>(id: string): T | null => {
      try { return ServiceLocator.getSystem<T>(id); } catch { return null; }
    }
  }), []);

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => useContext(GameContext);
