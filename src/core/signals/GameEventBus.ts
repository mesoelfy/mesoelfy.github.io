import { GameEvents, GameEventPayloads } from './GameEvents';
import { IGameEventService } from '@/core/interfaces';
import { ServiceLocator } from '@/game/services/ServiceLocator';

type Handler<T extends GameEvents> = (payload: GameEventPayloads[T]) => void;

export class GameEventService implements IGameEventService {
  private listeners: { [K in GameEvents]?: Handler<K>[] } = {};
  private history: { event: string; payload: any; timestamp: number }[] = [];
  private readonly MAX_HISTORY = 50;

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
    if (process.env.NODE_ENV === 'development') {
        this.history.push({ event, payload, timestamp: Date.now() });
        if (this.history.length > this.MAX_HISTORY) this.history.shift();
    }

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

/**
 * STATIC FACADE (Compatibility Adapter)
 * Routes calls to the ServiceLocator's registered EventService.
 */
class GameEventBusFacade {
  private get service(): IGameEventService {
    try {
        return ServiceLocator.getGameEventBus();
    } catch {
        // Lazy-load if accessed before Engine Boot
        const impl = new GameEventService();
        ServiceLocator.register('GameEventService', impl);
        return impl;
    }
  }

  public subscribe<T extends GameEvents>(event: T, handler: Handler<T>) { 
      return this.service.subscribe(event, handler); 
  }
  
  public emit<T extends GameEvents>(event: T, payload: GameEventPayloads[T]) { 
      this.service.emit(event, payload); 
  }
  
  public clear() { this.service.clear(); }
}

export const GameEventBus = new GameEventBusFacade();
