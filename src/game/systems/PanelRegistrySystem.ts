import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { ViewportHelper, WorldRect } from '../utils/ViewportHelper';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { useStore } from '@/core/store/useStore';

const MAX_PANEL_HEALTH = 1000;

interface PanelState {
  health: number;
  isDestroyed: boolean;
}

class PanelRegistrySystemClass implements IGameSystem {
  private panelRects = new Map<string, WorldRect>();
  private observedElements = new Map<string, HTMLElement>();
  private panelStates = new Map<string, PanelState>();

  public systemIntegrity: number = 100;

  setup(locator: IServiceLocator): void {
    this.resetLogic();
    this.refreshAll();
  }

  update(delta: number, time: number): void {
    // Passive
  }

  teardown(): void {}

  public resetLogic() {
    for (const id of this.observedElements.keys()) {
        this.panelStates.set(id, { health: MAX_PANEL_HEALTH, isDestroyed: false });
    }
    this.calculateIntegrity();
  }

  // --- ACTIONS ---

  public damagePanel(id: string, amount: number) {
    if (useStore.getState().debugFlags.panelGodMode) return;

    const state = this.panelStates.get(id);
    if (!state || state.isDestroyed) return;

    state.health = Math.max(0, state.health - amount);
    
    if (state.health <= 0 && !state.isDestroyed) {
        state.isDestroyed = true;
        GameEventBus.emit(GameEvents.PANEL_DESTROYED, { id });
    } else {
        GameEventBus.emit(GameEvents.PANEL_DAMAGED, { id, amount, currentHealth: state.health });
    }
    
    this.calculateIntegrity();
  }

  public healPanel(id: string, amount: number) {
    const state = this.panelStates.get(id);
    if (!state) return;

    const wasDestroyed = state.isDestroyed;
    state.health = Math.min(MAX_PANEL_HEALTH, state.health + amount);
    
    if (wasDestroyed && state.health >= MAX_PANEL_HEALTH) {
        state.isDestroyed = false;
        state.health = 500; 
    }
    
    this.calculateIntegrity();
  }

  public decayPanel(id: string, amount: number) {
     const state = this.panelStates.get(id);
     if (!state || !state.isDestroyed) return;
     state.health = Math.max(0, state.health - amount);
  }

  // NEW: Forcefully destroy everything for FORCE_CRASH
  public destroyAll() {
      for (const [id, state] of this.panelStates) {
          state.health = 0;
          state.isDestroyed = true;
          GameEventBus.emit(GameEvents.PANEL_DESTROYED, { id });
      }
      this.calculateIntegrity();
  }

  private calculateIntegrity() {
    let current = 0;
    let max = 0;
    for (const state of this.panelStates.values()) {
        max += MAX_PANEL_HEALTH;
        if (!state.isDestroyed) current += state.health;
    }
    this.systemIntegrity = max > 0 ? (current / max) * 100 : 100;
  }

  public register(id: string, element: HTMLElement) {
    this.observedElements.set(id, element);
    if (!this.panelStates.has(id)) {
        this.panelStates.set(id, { health: MAX_PANEL_HEALTH, isDestroyed: false });
    }
    this.refreshSingle(id);
  }

  public unregister(id: string) {
    this.observedElements.delete(id);
    this.panelRects.delete(id);
    this.panelStates.delete(id);
  }

  public refreshSingle(id: string) {
    const el = this.observedElements.get(id);
    if (!el || !el.isConnected) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    this.panelRects.set(id, ViewportHelper.domToWorld(id, rect));
  }

  public refreshAll() {
    const ids = Array.from(this.observedElements.keys());
    for (const id of ids) this.refreshSingle(id);
  }

  public getPanelRect(id: string): WorldRect | undefined {
    return this.panelRects.get(id);
  }

  public getPanelState(id: string): PanelState | undefined {
    return this.panelStates.get(id);
  }
  
  public getAllPanels() {
      const result = [];
      for(const [id, rect] of this.panelRects) {
          const state = this.panelStates.get(id) || { health: 0, isDestroyed: true };
          result.push({ ...rect, ...state });
      }
      return result;
  }
}

export const PanelRegistry = new PanelRegistrySystemClass();
