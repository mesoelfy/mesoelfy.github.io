import { GameEventBus } from '@/core/signals/GameEventBus';
import { GameEvents } from '@/core/signals/GameEvents';
import { useStore } from '@/game/state/global/useStore';

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
  }

  public damage(id: string, amount: number) {
    if (useStore.getState().debugFlags.panelGodMode) return;

    const state = this.states.get(id);
    if (!state || state.isDestroyed) return;

    state.health = Math.max(0, state.health - amount);

    if (state.health <= 0) {
        state.isDestroyed = true;
        state.health = 0;
        GameEventBus.emit(GameEvents.PANEL_DESTROYED, { id });
        GameEventBus.emit(GameEvents.LOG_DEBUG, { msg: `SECTOR LOST: ${id}`, source: 'StructureService' });
    } else {
        GameEventBus.emit(GameEvents.PANEL_DAMAGED, { id, amount, currentHealth: state.health });
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
        state.health = MAX_PANEL_HEALTH * 0.5;
        
        // PASS sourceX
        GameEventBus.emit(GameEvents.PANEL_RESTORED, { id, x: sourceX });
        GameEventBus.emit(GameEvents.LOG_DEBUG, { msg: `SECTOR RESTORED: ${id}`, source: 'StructureService' });
    }
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
              state.health = MAX_PANEL_HEALTH * 0.5;
              GameEventBus.emit(GameEvents.PANEL_RESTORED, { id });
              restored++;
          } else if (state.health < MAX_PANEL_HEALTH) {
              state.health = MAX_PANEL_HEALTH;
          }
      }
      this.calculateIntegrity();
      return restored;
  }

  public destroyAll() {
      for (const [id, state] of this.states) {
          state.health = 0;
          state.isDestroyed = true;
          GameEventBus.emit(GameEvents.PANEL_DESTROYED, { id });
      }
      this.calculateIntegrity();
  }

  private calculateIntegrity() {
    let current = 0;
    let max = 0;
    for (const state of this.states.values()) {
        max += MAX_PANEL_HEALTH;
        if (!state.isDestroyed) current += state.health;
    }
    this.systemIntegrity = max > 0 ? (current / max) * 100 : 100;
  }

  public getState(id: string) {
      return this.states.get(id);
  }

  public getAllStates() {
      return this.states;
  }
}

export const StructureHealthService = new StructureHealthServiceController();
