import { ServiceLocator } from '@/engine/services/ServiceLocator';

export type StreamKey = 
  | 'PLAYER_HEALTH' 
  | 'PLAYER_MAX_HEALTH' 
  | 'PLAYER_REBOOT' 
  | 'SYSTEM_INTEGRITY' 
  | 'SCORE' 
  | 'XP' 
  | 'XP_NEXT' 
  | 'LEVEL'
  | 'PLAYER_INTERACTION_STATE' // 0: Idle, 1: Healing Self, 2: Reviving Self
  | 'PLAYER_PURGE_ACTIVE'      // 0: Inactive, 1: Active
  // Panel Health Keys
  | 'PANEL_HEALTH_IDENTITY'
  | 'PANEL_HEALTH_SOCIAL'
  | 'PANEL_HEALTH_FEED'
  | 'PANEL_HEALTH_ART'
  | 'PANEL_HEALTH_VIDEO';

type Listener = (val: number) => void;

class GameStreamService {
  private values = new Map<StreamKey, number>();
  private listeners = new Map<StreamKey, Set<Listener>>();

  constructor() {
    // Initialize defaults to avoid NaNs on UI mount
    this.values.set('PLAYER_HEALTH', 100);
    this.values.set('PLAYER_MAX_HEALTH', 100);
    this.values.set('SYSTEM_INTEGRITY', 100);
    this.values.set('SCORE', 0);
    this.values.set('XP', 0);
    this.values.set('XP_NEXT', 100);
    this.values.set('LEVEL', 1);
    this.values.set('PLAYER_REBOOT', 0);
    this.values.set('PLAYER_INTERACTION_STATE', 0);
    this.values.set('PLAYER_PURGE_ACTIVE', 0);
    
    // Panel Defaults
    this.values.set('PANEL_HEALTH_IDENTITY', 100);
    this.values.set('PANEL_HEALTH_SOCIAL', 100);
    this.values.set('PANEL_HEALTH_FEED', 100);
    this.values.set('PANEL_HEALTH_ART', 100);
    this.values.set('PANEL_HEALTH_VIDEO', 100);
  }

  public set(key: StreamKey, value: number) {
    if (this.values.get(key) === value) return;
    this.values.set(key, value);
    const subs = this.listeners.get(key);
    if (subs) subs.forEach(fn => fn(value));
  }

  public get(key: StreamKey): number {
    return this.values.get(key) || 0;
  }

  public subscribe(key: StreamKey, callback: Listener): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);
    callback(this.get(key));
    return () => {
      const subs = this.listeners.get(key);
      if (subs) subs.delete(callback);
    };
  }
}

export const GameStream = new GameStreamService();
