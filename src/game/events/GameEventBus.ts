import { GameEvents, GameEventPayloads } from './GameEvents';

type Handler<T extends GameEvents> = (payload: GameEventPayloads[T]) => void;

class GameEventBusController {
  private listeners: Partial<Record<GameEvents, Function[]>> = {};
  private history: { event: string; payload: any; timestamp: number }[] = [];
  private readonly MAX_HISTORY = 50;

  public subscribe<T extends GameEvents>(event: T, handler: Handler<T>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(handler);

    return () => {
      this.listeners[event] = this.listeners[event]!.filter(h => h !== handler);
    };
  }

  public emit<T extends GameEvents>(event: T, payload: GameEventPayloads[T]): void {
    // 1. Log History
    this.history.push({ event, payload, timestamp: Date.now() });
    if (this.history.length > this.MAX_HISTORY) {
      this.history.shift();
    }

    // 2. Dispatch
    if (!this.listeners[event]) return;
    [...this.listeners[event]!].forEach(handler => handler(payload));
  }

  public clear(): void {
    this.listeners = {};
    this.history = [];
  }

  public dumpHistory(): void {
    console.table(this.history);
  }
}

export const GameEventBus = new GameEventBusController();
