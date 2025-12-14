import { GameEvents, GameEventPayloads } from './GameEvents';

type Handler<T extends GameEvents> = (payload: GameEventPayloads[T]) => void;

class GameEventBusController {
  // Use a mapped type for strict safety
  private listeners: { [K in GameEvents]?: Handler<K>[] } = {};
  
  private history: { event: string; payload: any; timestamp: number }[] = [];
  private readonly MAX_HISTORY = 50;

  public subscribe<T extends GameEvents>(event: T, handler: Handler<T>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    // Force cast to generic array to satisfy TS compiler index signature
    (this.listeners[event] as Handler<T>[]).push(handler);

    return () => {
      if (!this.listeners[event]) return;
      this.listeners[event] = (this.listeners[event] as Handler<T>[]).filter(h => h !== handler) as any;
    };
  }

  public emit<T extends GameEvents>(event: T, payload: GameEventPayloads[T]): void {
    // 1. Log History (Debug only)
    if (process.env.NODE_ENV === 'development') {
        this.history.push({ event, payload, timestamp: Date.now() });
        if (this.history.length > this.MAX_HISTORY) this.history.shift();
    }

    // 2. Dispatch
    const handlers = this.listeners[event];
    if (handlers) {
        handlers.forEach(handler => handler(payload));
    }
  }

  public clear(): void {
    this.listeners = {};
    this.history = [];
  }
}

export const GameEventBus = new GameEventBusController();
