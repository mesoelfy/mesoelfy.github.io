import { IGameSystem, IServiceLocator, IPanelSystem } from '../core/interfaces';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { WorldRect } from '../utils/ViewportHelper';

// Services
import { DOMSpatialService } from '../services/DOMSpatialService';
import { StructureHealthService } from '../services/StructureHealthService';

class PanelRegistrySystemClass implements IPanelSystem {
  
  // Expose integrity via getter to match Interface
  public get systemIntegrity() {
      return StructureHealthService.systemIntegrity;
  }

  setup(locator: IServiceLocator): void {
    StructureHealthService.reset();
    DOMSpatialService.refreshAll();
    
    // Wire up Upgrade Event -> Service Logic
    GameEventBus.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        if (p.option === 'RESTORE') {
            const restoredCount = StructureHealthService.restoreAll();
            
            if (restoredCount > 0) {
                GameEventBus.emit(GameEvents.TRAUMA_ADDED, { amount: 0.3 }); 
                AudioSystem.playSound('fx_reboot_success'); 
                
                // Spawn FX on newly restored panels
                // We iterate checking who was destroyed? No, simplest is just center screen FX or
                // we can iterate the rects.
                // For now, keep it simple.
            }
        }
    });
  }

  update(delta: number, time: number): void {
      // Logic moved to Services or specific systems (like InteractionSystem)
  }

  teardown(): void {}

  // --- IPanelSystem Implementation (Delegation) ---

  public register(id: string, element: HTMLElement) {
      DOMSpatialService.register(id, element);
      StructureHealthService.register(id);
  }

  public unregister(id: string) {
      DOMSpatialService.unregister(id);
      StructureHealthService.unregister(id);
  }

  public refreshSingle(id: string) {
      DOMSpatialService.refreshSingle(id);
  }

  public refreshAll() {
      DOMSpatialService.refreshAll();
  }

  public damagePanel(id: string, amount: number) {
      StructureHealthService.damage(id, amount);
  }

  public healPanel(id: string, amount: number) {
      StructureHealthService.heal(id, amount);
  }
  
  public decayPanel(id: string, amount: number) {
      StructureHealthService.decay(id, amount);
  }

  public destroyAll() {
      StructureHealthService.destroyAll();
  }

  public getPanelRect(id: string): WorldRect | undefined {
      return DOMSpatialService.getRect(id);
  }

  public getPanelState(id: string) {
      return StructureHealthService.getState(id);
  }
  
  // Composite Data Getter (Used by UI Sync)
  public getAllPanels() {
      const results = [];
      const rects = DOMSpatialService.getAllRects();
      const states = StructureHealthService.getAllStates();
      
      for(const [id, rect] of rects) {
          const state = states.get(id) || { health: 0, isDestroyed: true };
          results.push({ ...rect, ...state });
      }
      return results;
  }
}

export const PanelRegistry = new PanelRegistrySystemClass();
