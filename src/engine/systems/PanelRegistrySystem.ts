import { IPanelSystem, IGameEventService, IAudioService } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { WorldRect } from '@/engine/math/ViewportHelper';
import { DOMSpatialService } from '@/engine/services/DOMSpatialService';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { useStore } from '@/engine/state/global/useStore';

export class PanelRegistrySystem implements IPanelSystem {
  
  public get systemIntegrity() {
      return useGameStore.getState().systemIntegrity;
  }

  constructor(
    private events: IGameEventService,
    private audio: IAudioService
  ) {
    DOMSpatialService.refreshAll();
    
    // Listen for Upgrade Selection
    this.events.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        if (p.option === 'RESTORE') {
            const restoredCount = useGameStore.getState().restoreAllPanels();
            if (restoredCount > 0) {
                this.events.emit(GameEvents.TRAUMA_ADDED, { amount: 0.3 }); 
                this.audio.playSound('fx_reboot_success'); 
            }
        }
    });

    // Listen for Zen Mode (Purge)
    this.events.subscribe(GameEvents.ZEN_MODE_ENABLED, () => {
        // Destroy all panels to match the "Purge" aesthetic (System wiped)
        this.destroyAll();
    });
  }

  update(delta: number, time: number): void {}

  teardown(): void {}

  public register(id: string, element: HTMLElement) {
      DOMSpatialService.register(id, element);
      useGameStore.getState().registerPanel(id, element);
  }

  public unregister(id: string) {
      DOMSpatialService.unregister(id);
      useGameStore.getState().unregisterPanel(id);
  }

  public refreshAll() { DOMSpatialService.refreshAll(); }
  public refreshSingle(id: string) { DOMSpatialService.refreshSingle(id); }

  public damagePanel(id: string, amount: number, silent: boolean = false, sourceX?: number, sourceY?: number) {
      if (useStore.getState().debugFlags.panelGodMode) return;
      useGameStore.getState().damagePanel(id, amount, silent, sourceX, sourceY);
  }

  public healPanel(id: string, amount: number, sourceX?: number) {
      useGameStore.getState().healPanel(id, amount, sourceX);
  }
  
  public decayPanel(id: string, amount: number) {
      useGameStore.getState().decayPanel(id, amount);
  }

  public destroyAll() { 
      useGameStore.getState().destroyAllPanels();
  }

  public getPanelRect(id: string): WorldRect | undefined {
      return DOMSpatialService.getRect(id);
  }

  public getPanelState(id: string) {
      const panel = useGameStore.getState().panels[id];
      if (!panel) return undefined;
      return { health: panel.health, isDestroyed: panel.isDestroyed };
  }
  
  public getAllPanels() {
      const results = [];
      const rects = DOMSpatialService.getAllRects();
      const state = useGameStore.getState();
      
      for(const [id, rect] of rects) {
          const panel = state.panels[id] || { health: 0, isDestroyed: true };
          results.push({ ...rect, health: panel.health, isDestroyed: panel.isDestroyed });
      }
      return results;
  }
}
