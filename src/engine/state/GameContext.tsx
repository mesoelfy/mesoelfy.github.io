import React, { createContext, useContext, ReactNode } from 'react';
import { IAudioService, IInputService } from '@/engine/interfaces';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { AudioServiceImpl } from '@/engine/audio/AudioService';
import { InputSystem } from '@/engine/systems/InputSystem';

interface GameContextProps {
  audio: IAudioService;
  input: IInputService;
}

// Default mock to prevent crash if accessed outside provider
const defaultContext: GameContextProps = {
  audio: new AudioServiceImpl(),
  input: new InputSystem() 
};

const GameContext = createContext<GameContextProps>(defaultContext);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  // In a real scenario, these might be passed in props or instantiated here.
  // For now, we bridge the ServiceLocator to the Context.
  // This ensures that even if components use hooks, they get the singleton.
  
  let audio: IAudioService;
  let input: IInputService;

  try {
      audio = ServiceLocator.getAudioService();
  } catch {
      // Fallback if not initialized yet (should rarely happen with this flow)
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

  return (
    <GameContext.Provider value={{ audio, input }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => useContext(GameContext);
