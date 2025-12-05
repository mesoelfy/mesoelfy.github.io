import { useGameStore } from '../store/useGameStore';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../config/Identifiers';
import { ServiceLocator } from '../core/ServiceLocator';
import { ViewportHelper } from '../utils/ViewportHelper';

export class InteractionSystem {
  private lastRepairTime = 0;
  private REPAIR_RATE = 0.05;
  
  public update(time: number, cursor: {x: number, y: number}): boolean {
    if (time < this.lastRepairTime + this.REPAIR_RATE) return false;

    const panels = useGameStore.getState().panels;
    const healFn = useGameStore.getState().healPanel;
    let isRepairing = false;

    for (const pKey in panels) {
      const p = panels[pKey];
      
      if (p.isDestroyed || p.health >= 1000) continue;

      const r = ViewportHelper.getPanelWorldRect(p);
      if (!r) continue;

      if (
        cursor.x >= r.left && 
        cursor.x <= r.right && 
        cursor.y >= r.bottom && 
        cursor.y <= r.top
      ) {
        isRepairing = true;
        healFn(p.id, 10); 
        this.lastRepairTime = time;
        GameEventBus.emit(GameEvents.PANEL_HEALED, { id: p.id, amount: 10 });
        
        if (Math.random() > 0.6) {
            ServiceLocator.entitySystem.spawnParticle(cursor.x, cursor.y, '#00F0FF', 1);
        }
        break; 
      }
    }
    
    return isRepairing;
  }
}
