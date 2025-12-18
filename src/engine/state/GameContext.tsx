import React, { createContext, useContext, ReactNode } from 'react';
import { IAudioService, IInputService, IGameEventService } from '@/engine/interfaces';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { AudioServiceImpl } from '@/engine/audio/AudioService';
import { InputSystem } from '@/engine/systems/InputSystem';
import { GameEventService } from '@/engine/signals/GameEventBus';

interface GameContextProps {
  audio: IAudioService;
  input: IInputService;
  events: IGameEventService;
}

// Default mock to prevent crash if accessed outside provider
const defaultContext: GameContextProps = {
  audio: new AudioServiceImpl(),
  input: new InputSystem(),
  events: new GameEventService()
};

const GameContext = createContext<GameContextProps>(defaultContext);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  let audio: IAudioService;
  let input: IInputService;
  let events: IGameEventService;

  try {
      audio = ServiceLocator.getAudioService();
  } catch {
      const impl = new AudioServiceImpl();
      ServiceLocator.register('AudioService', impl);
      audio = impl;
  }

  try {
      input = ServiceLocator.getInputService();
  } catch {
      const impl = new InputSystem();
      ServiceLocator.register('InputSystem', impl);
      input = impl;
  }

  try {
      events = ServiceLocator.getGameEventBus();
  } catch {
      const impl = new GameEventService();
      ServiceLocator.register('GameEventService', impl);
      events = impl;
  }

  return (
    <GameContext.Provider value={{ audio, input, events }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => useContext(GameContext);
