import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { useStore } from '@/engine/state/global/useStore';
import { useGameStore } from '@/engine/state/game/useGameStore';

const MAX_PANEL_HEALTH = 100;

export interface StructureState {
  health: number;
  isDestroyed: boolean;
}

class StructureHealthServiceController {
  private states = new Map<string, StructureState>();
  public systemIntegrity: number = 100;

  public register(id: string) {
    if (!this.states.has(id)) {
        this.states.set(id, { health: MAX_PANEL_HEALTH, isDestroyed: false });
    }
    this.calculateIntegrity();
  }

  public unregister(id: string) {
    this.states.delete(id);
    this.calculateIntegrity();
  }

  public reset() {
    for (const state of this.states.values()) {
        state.health = MAX_PANEL_HEALTH;
        state.isDestroyed = false;
    }
    this.calculateIntegrity();
    this.syncAllPanelsToStore();
  }

  public damage(id: string, amount: number, silent: boolean = false) {
    if (useStore.getState().debugFlags.panelGodMode) return;
    const state = this.states.get(id);
    if (!state || state.isDestroyed) return;
    state.health = Math.max(0, state.health - amount);
    
    if (state.health <= 0) {
        state.isDestroyed = true;
        state.health = 0;
        this.syncPanelToStore(id); // State Change -> Sync
        
        if (!silent) {
            GameEventBus.emit(GameEvents.PANEL_DESTROYED, { id });
            GameEventBus.emit(GameEvents.LOG_DEBUG, { msg: `SECTOR LOST: ${id}`, source: 'StructureService' });
        }
    } else if (!silent) {
        GameEventBus.emit(GameEvents.PANEL_DAMAGED, { id, amount, currentHealth: state.health });
        this.syncPanelToStore(id);
    }
    this.calculateIntegrity();
  }

  public heal(id: string, amount: number, sourceX?: number) {
    const state = this.states.get(id);
    if (!state) return;
    const wasDestroyed = state.isDestroyed;
    
    state.health = Math.min(MAX_PANEL_HEALTH, state.health + amount);
    
    if (wasDestroyed && state.health >= MAX_PANEL_HEALTH) {
        state.isDestroyed = false;
        state.health = MAX_PANEL_HEALTH * 0.3;
        GameEventBus.emit(GameEvents.PANEL_RESTORED, { id, x: sourceX });
        GameEventBus.emit(GameEvents.LOG_DEBUG, { msg: `SECTOR RESTORED: ${id}`, source: 'StructureService' });
    }
    
    this.syncPanelToStore(id);
    this.calculateIntegrity();
  }

  public decay(id: string, amount: number) {
      const state = this.states.get(id);
      if (!state || !state.isDestroyed) return;
      state.health = Math.max(0, state.health - amount);
  }

  public restoreAll() {
      let restored = 0;
      for (const [id, state] of this.states) {
          if (state.isDestroyed) {
              state.isDestroyed = false;
              state.health = MAX_PANEL_HEALTH * 0.3;
              GameEventBus.emit(GameEvents.PANEL_RESTORED, { id });
              restored++;
          } else if (state.health < MAX_PANEL_HEALTH) {
              state.health = MAX_PANEL_HEALTH;
          }
      }
      this.calculateIntegrity();
      this.syncAllPanelsToStore();
      return restored;
  }

  public destroyAll() {
      for (const [id, state] of this.states) {
          state.health = 0;
          state.isDestroyed = true;
          GameEventBus.emit(GameEvents.PANEL_DESTROYED, { id });
      }
      this.calculateIntegrity();
      this.syncAllPanelsToStore();
  }

  private calculateIntegrity() {
    let current = 0;
    let max = 0;
    for (const state of this.states.values()) {
        max += MAX_PANEL_HEALTH;
        if (!state.isDestroyed) current += state.health;
    }
    const newIntegrity = max > 0 ? (current / max) * 100 : 100;
    
    // Critical fix: Force sync if we drop below 1% to ensure UI catches Game Over
    const shouldSync = 
        Math.abs(this.systemIntegrity - newIntegrity) > 1.0 || 
        (newIntegrity <= 1.0 && this.systemIntegrity > 1.0) ||
        newIntegrity === 0;

    if (shouldSync) {
        this.systemIntegrity = newIntegrity;
        useGameStore.getState().setSystemIntegrity(this.systemIntegrity);
    } else {
        this.systemIntegrity = newIntegrity;
    }
  }

  private syncPanelToStore(id: string) {
      const state = this.states.get(id);
      if (state) {
          useGameStore.getState().syncPanels({ 
              [id]: { id, health: state.health, isDestroyed: state.isDestroyed } 
          });
      }
  }

  private syncAllPanelsToStore() {
      const payload: Record<string, any> = {};
      for (const [id, state] of this.states) {
          payload[id] = { id, health: state.health, isDestroyed: state.isDestroyed };
      }
      useGameStore.getState().syncPanels(payload);
  }

  public getState(id: string) { return this.states.get(id); }
  public getAllStates() { return this.states; }
}

export const StructureHealthService = new StructureHealthServiceController();
