import { IPanelSystem, IGameEventService, IAudioService } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { WorldRect } from '@/engine/math/ViewportHelper';
import { DOMSpatialService } from '@/engine/services/DOMSpatialService';
import { StructureHealthService } from '@/engine/services/StructureHealthService';

export class PanelRegistrySystem implements IPanelSystem {
  
  public get systemIntegrity() {
      return StructureHealthService.systemIntegrity;
  }

  constructor(
    private events: IGameEventService,
    private audio: IAudioService
  ) {
    StructureHealthService.reset();
    DOMSpatialService.refreshAll();
    
    this.events.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        if (p.option === 'RESTORE') {
            const restoredCount = StructureHealthService.restoreAll();
            
            if (restoredCount > 0) {
                this.events.emit(GameEvents.TRAUMA_ADDED, { amount: 0.3 }); 
                this.audio.playSound('fx_reboot_success'); 
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

  public refreshAll() { DOMSpatialService.refreshAll(); }
  public refreshSingle(id: string) { DOMSpatialService.refreshSingle(id); }

  public damagePanel(id: string, amount: number) {
      StructureHealthService.damage(id, amount);
  }

  public healPanel(id: string, amount: number, sourceX?: number) {
      StructureHealthService.heal(id, amount, sourceX);
  }
  
  public decayPanel(id: string, amount: number) {
      StructureHealthService.decay(id, amount);
  }

  public destroyAll() { StructureHealthService.destroyAll(); }

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
