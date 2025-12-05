import { GameEvents, GameEventPayloads } from '../events/GameEvents';

export interface IGameSystem {
  /** Called once when the game engine initializes */
  setup(locator: IServiceLocator): void;
  
  /** Called every frame (tick) */
  update(delta: number, time: number): void;
  
  /** Called when the game stops or resets */
  teardown(): void;
}

export interface IServiceLocator {
  getSystem<T extends IGameSystem>(id: string): T;
  registerSystem(id: string, system: IGameSystem): void;
  
  // Specific Services
  getAudioService(): IAudioService;
  getInputService(): IInputService;
}

export interface IAudioService {
  playSound(key: string, volume?: number): void;
  playMusic(key: string): void;
  setVolume(volume: number): void;
}

export interface IInputService {
  getCursor(): { x: number, y: number };
  isPressed(action: string): boolean;
}

export interface IEventBus {
  emit<T extends GameEvents>(event: T, payload: GameEventPayloads[T]): void;
  subscribe<T extends GameEvents>(event: T, handler: (p: GameEventPayloads[T]) => void): () => void;
}
