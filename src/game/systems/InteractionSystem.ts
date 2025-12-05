import { useGameStore } from '../store/useGameStore';
import { GameEventBus } from '../events/GameEventBus';
import { ServiceLocator } from '../core/ServiceLocator';
import { ViewportHelper } from '../utils/ViewportHelper';

export class InteractionSystem {
  private lastRepairTime = 0;
  private REPAIR_RATE = 0.05;
  
  // Returns true if currently repairing
  public update(time: number, cursor: {x: number, y: number}): boolean {
    if (time < this.lastRepairTime + this.REPAIR_RATE) return false;

    const panels = useGameStore.getState().panels;
    const healFn = useGameStore.getState().healPanel;
    let isRepairing = false;

    for (const pKey in panels) {
      const p = panels[pKey];
      
      // Skip destroyed or full health panels
      if (p.isDestroyed || p.health >= 1000) continue;

      const r = ViewportHelper.getPanelWorldRect(p);
      if (!r) continue;

      // AABB Check: Cursor inside Panel
      if (
        cursor.x >= r.left && 
        cursor.x <= r.right && 
        cursor.y >= r.bottom && 
        cursor.y <= r.top
      ) {
        isRepairing = true;
        healFn(p.id, 10); 
        this.lastRepairTime = time;
        GameEventBus.emit('PANEL_HEALED', { id: p.id, amount: 10 });
        
        // Spawn Visuals
        if (Math.random() > 0.6) {
            ServiceLocator.entitySystem.spawnParticle(cursor.x, cursor.y, '#00F0FF', 1);
        }
        break; // Only repair one at a time
      }
    }
    
    return isRepairing;
  }
}
