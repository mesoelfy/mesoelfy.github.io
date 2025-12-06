import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { ViewportHelper, WorldRect } from '../utils/ViewportHelper';

class PanelRegistrySystemClass implements IGameSystem {
  private panelCache = new Map<string, WorldRect>();
  private observedElements = new Map<string, HTMLElement>();

  setup(locator: IServiceLocator): void {
    this.refreshAll();
  }

  update(delta: number, time: number): void {
    // Reactive system
  }

  teardown(): void {
    // Persist cache across hot-reloads/restarts
  }

  // --- API ---

  public register(id: string, element: HTMLElement) {
    this.observedElements.set(id, element);
    this.refreshSingle(id);
  }

  public unregister(id: string) {
    this.observedElements.delete(id);
    this.panelCache.delete(id);
  }

  public refreshSingle(id: string) {
    const el = this.observedElements.get(id);
    if (!el || !el.isConnected) { // Check if element is actually in DOM
        if (el && !el.isConnected) this.unregister(id);
        return;
    }

    const rect = el.getBoundingClientRect();
    
    // Safety check for invisible/collapsed elements
    if (rect.width === 0 && rect.height === 0) return;

    const worldRect = ViewportHelper.domToWorld(id, rect);
    this.panelCache.set(id, worldRect);
  }

  public refreshAll() {
    // Using Array.from to avoid iterator invalidation issues during unregister
    const ids = Array.from(this.observedElements.keys());
    for (const id of ids) {
      this.refreshSingle(id);
    }
  }

  public getPanelRect(id: string): WorldRect | undefined {
    return this.panelCache.get(id);
  }

  public getAllPanels(): WorldRect[] {
    return Array.from(this.panelCache.values());
  }
}

export const PanelRegistry = new PanelRegistrySystemClass();
