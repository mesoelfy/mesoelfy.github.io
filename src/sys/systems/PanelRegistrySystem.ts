import { IGameSystem, IServiceLocator, IPanelSystem } from '@/engine/interfaces';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { WorldRect } from '@/engine/math/ViewportHelper';

// Services
import { DOMSpatialService } from '@/sys/services/DOMSpatialService';
import { StructureHealthService } from '@/sys/services/StructureHealthService';

class PanelRegistrySystemClass implements IPanelSystem {
  
  public get systemIntegrity() {
      return StructureHealthService.systemIntegrity;
  }

  setup(locator: IServiceLocator): void {
    StructureHealthService.reset();
    DOMSpatialService.refreshAll();
    
    GameEventBus.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        if (p.option === 'RESTORE') {
            const restoredCount = StructureHealthService.restoreAll();
            
            if (restoredCount > 0) {
                GameEventBus.emit(GameEvents.TRAUMA_ADDED, { amount: 0.3 }); 
                AudioSystem.playSound('fx_reboot_success'); 
            }
        }
    });
  }

  update(delta: number, time: number): void {
  }

  teardown(): void {}

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

  // UPDATED
  public healPanel(id: string, amount: number, sourceX?: number) {
      StructureHealthService.heal(id, amount, sourceX);
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
