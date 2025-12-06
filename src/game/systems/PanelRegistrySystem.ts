import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { ViewportHelper, WorldRect } from '../utils/ViewportHelper';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';

const MAX_PANEL_HEALTH = 1000;

interface PanelState {
  health: number;
  isDestroyed: boolean;
}

class PanelRegistrySystemClass implements IGameSystem {
  // Spatial Data
  private panelRects = new Map<string, WorldRect>();
  private observedElements = new Map<string, HTMLElement>();
  
  // Game Logic Data
  private panelStates = new Map<string, PanelState>();

  // Derived Metric
  public systemIntegrity: number = 100;

  setup(locator: IServiceLocator): void {
    // When game starts, we ensure states exist for all registered panels
    this.resetLogic();
    this.refreshAll();
  }

  update(delta: number, time: number): void {
    // Passive
  }

  teardown(): void {
    // We don't clear observedElements (DOM persists), but we can reset game logic?
    // Actually, let's keep logic state until explicit reset.
  }

  public resetLogic() {
    for (const id of this.observedElements.keys()) {
        this.panelStates.set(id, { health: MAX_PANEL_HEALTH, isDestroyed: false });
    }
    this.calculateIntegrity();
  }

  // --- ACTIONS ---

  public damagePanel(id: string, amount: number) {
    const state = this.panelStates.get(id);
    if (!state || state.isDestroyed) return;

    state.health = Math.max(0, state.health - amount);
    
    // Check Destruction
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

    // Logic: If destroyed, healing brings it back to life but starts at low HP?
    // Or does "Rebooting" bring it back?
    // Let's stick to existing logic: Healing increments HP.
    // If destroyed, you must heal it back to full? Or just some?
    // Let's say: Healing works. If destroyed, getting > 0 doesn't undestroy immediately?
    // Existing logic: "If wasDestroyed and newHealth >= MAX, then undestroy".
    // Wait, InteractionSystem handles the "Reboot vs Heal" logic.
    // Let's allow simple healing here.
    
    const wasDestroyed = state.isDestroyed;
    state.health = Math.min(MAX_PANEL_HEALTH, state.health + amount);
    
    if (wasDestroyed && state.health >= MAX_PANEL_HEALTH) {
        state.isDestroyed = false;
        state.health = 500; // Reset to half health upon revival? Or logic from store...
        // Previous store logic: "if wasDestroyed and newHealth >= MAX ... newHealth = 500"
        // That logic was weird. Let's simplify:
        // You have to fill the bar to revive.
    }
    
    this.calculateIntegrity();
  }

  public decayPanel(id: string, amount: number) {
     const state = this.panelStates.get(id);
     if (!state || !state.isDestroyed) return;
     state.health = Math.max(0, state.health - amount);
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

  // --- REGISTRY API ---

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
    // We keep state in case it remounts? No, delete state too.
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

  // --- GETTERS ---

  public getPanelRect(id: string): WorldRect | undefined {
    return this.panelRects.get(id);
  }

  public getPanelState(id: string): PanelState | undefined {
    return this.panelStates.get(id);
  }
  
  public getAllPanels() {
      // Return combined data
      const result = [];
      for(const [id, rect] of this.panelRects) {
          const state = this.panelStates.get(id) || { health: 0, isDestroyed: true };
          result.push({ ...rect, ...state });
      }
      return result;
  }
}

export const PanelRegistry = new PanelRegistrySystemClass();
