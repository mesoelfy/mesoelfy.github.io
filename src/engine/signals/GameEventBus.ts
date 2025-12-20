import { GameEvents, GameEventPayloads } from './GameEvents';
import { IGameEventService } from '@/engine/interfaces';

type Handler<T extends GameEvents> = (payload: GameEventPayloads[T]) => void;

export class GameEventService implements IGameEventService {
  private listeners: { [K in GameEvents]?: Handler<K>[] } = {};
  
  public subscribe<T extends GameEvents>(event: T, handler: Handler<T>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    (this.listeners[event] as Handler<T>[]).push(handler);

    return () => {
      if (!this.listeners[event]) return;
      this.listeners[event] = (this.listeners[event] as Handler<T>[]).filter(h => h !== handler) as any;
    };
  }

  public emit<T extends GameEvents>(event: T, payload: GameEventPayloads[T]): void {
    const handlers = this.listeners[event];
    if (handlers) {
        handlers.forEach(handler => handler(payload));
    }
  }

  public clear(): void {
    this.listeners = {};
  }
}

// --- SINGLETON INSTANCE ---
// This ensures that whether imported by UI or Engine, it's the same object.
export const SharedGameEventBus = new GameEventService();

// Export as default alias for compatibility
export const GameEventBus = SharedGameEventBus;
