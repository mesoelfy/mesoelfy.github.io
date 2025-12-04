// src/game/events/GameEventBus.ts
import { GameEventType, GameEventPayloads } from './GameEvents';

type EventHandler<T extends GameEventType> = (payload: GameEventPayloads[T]) => void;

class GameEventBusController {
  private listeners: Partial<Record<GameEventType, EventHandler<any>[]>> = {};

  // Subscribe to an event
  public subscribe<T extends GameEventType>(event: T, handler: EventHandler<T>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(handler);

    // Return unsubscribe function (Cleanup)
    return () => {
      this.listeners[event] = this.listeners[event]!.filter(h => h !== handler);
    };
  }

  // Publish an event
  public emit<T extends GameEventType>(event: T, payload: GameEventPayloads[T]): void {
    if (!this.listeners[event]) return;
    
    // Iterate over a copy to allow handlers to unsubscribe during execution
    [...this.listeners[event]!].forEach(handler => handler(payload));
  }

  public clear(): void {
    this.listeners = {};
  }
}

// Singleton Instance
export const GameEventBus = new GameEventBusController();
