import { useGameStore } from '../store/useGameStore';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../config/Identifiers';
import { ServiceLocator } from '../core/ServiceLocator';
import { ViewportHelper } from '../utils/ViewportHelper';

export class InteractionSystem {
  private lastRepairTime = 0;
  private REPAIR_RATE = 0.05;
  
  public update(time: number, cursor: {x: number, y: number}): boolean {
    const store = useGameStore.getState();
    if (!store.isPlaying) return false;

    if (time < this.lastRepairTime + this.REPAIR_RATE) return false;

    const panels = store.panels;
    const healFn = store.healPanel;
    const decayFn = store.decayReboot;
    const tickReboot = store.tickPlayerReboot; 
    
    let isRepairing = false;
    let repairedPanelId = null;
    let isRebootingPlayer = false;

    // --- 1. PLAYER REVIVAL LOGIC ---
    if (store.playerHealth <= 0) {
        const identityPanel = panels['identity'];
        
        // Allow revival even if panel is destroyed
        if (identityPanel) {
            const rect = ViewportHelper.getPanelWorldRect(identityPanel);
            if (rect) {
                // Expanded Hitbox for easier revival
                const padding = 2.0; 
                
                if (
                    cursor.x >= rect.left - padding && 
                    cursor.x <= rect.right + padding && 
                    cursor.y >= rect.bottom - padding && 
                    cursor.y <= rect.top + padding
                ) {
                    // INCREASED SPEED: 2.5 per tick (approx 2s to revive)
                    tickReboot(2.5); 
                    
                    isRepairing = true;
                    isRebootingPlayer = true;
                    this.lastRepairTime = time;
                    
                    if (Math.random() > 0.5) {
                        ServiceLocator.entitySystem.spawnParticle(cursor.x, cursor.y, '#eae747', 1);
                    }
                }
            }
        }
        
        // REDUCED DECAY: -2.0 per tick (slower drain if you slip off)
        if (!isRebootingPlayer && store.playerRebootProgress > 0) {
            tickReboot(-2.0);
        }
        
        if (isRebootingPlayer) return true; 
    }

    // --- 2. PANEL REPAIR LOGIC ---
    for (const pKey in panels) {
      const p = panels[pKey];
      
      if (!p.isDestroyed && p.health >= 1000) continue;

      const r = ViewportHelper.getPanelWorldRect(p);
      if (!r) continue;

      if (
        cursor.x >= r.left && 
        cursor.x <= r.right && 
        cursor.y >= r.bottom && 
        cursor.y <= r.top
      ) {
        isRepairing = true;
        repairedPanelId = p.id;
        
        healFn(p.id, 10); 
        this.lastRepairTime = time;
        
        if (!p.isDestroyed) {
            GameEventBus.emit(GameEvents.PANEL_HEALED, { id: p.id, amount: 10 });
        }
        
        if (Math.random() > 0.6) {
            const color = p.isDestroyed ? '#9E4EA5' : '#00F0FF'; 
            ServiceLocator.entitySystem.spawnParticle(cursor.x, cursor.y, color, 1);
        }
        break; 
      }
    }

    // --- 3. DECAY LOGIC (Panels) ---
    for (const pKey in panels) {
        const p = panels[pKey];
        if (p.isDestroyed && p.id !== repairedPanelId && p.health > 0) {
            decayFn(p.id, 5); 
        }
    }
    
    return isRepairing;
  }
}
