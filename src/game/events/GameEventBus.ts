// src/game/events/GameEventBus.ts
import { GameEvents } from '../config/Identifiers';

// Re-export specific types if needed or just use strings
export type GameEventType = keyof typeof GameEvents;

class GameEventBusController {
  private listeners: Partial<Record<string, Function[]>> = {};

  public subscribe(event: string, handler: Function): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(handler);

    return () => {
      this.listeners[event] = this.listeners[event]!.filter(h => h !== handler);
    };
  }

  public emit(event: string, payload: any): void {
    if (!this.listeners[event]) return;
    [...this.listeners[event]!].forEach(handler => handler(payload));
  }

  public clear(): void {
    this.listeners = {};
  }
}

export const GameEventBus = new GameEventBusController();
