import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { EntitySystem } from './EntitySystem';
import { useGameStore } from '../store/useGameStore';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { ViewportHelper } from '../utils/ViewportHelper';

export type RepairState = 'IDLE' | 'HEALING' | 'REBOOTING';

export class InteractionSystem implements IGameSystem {
  public repairState: RepairState = 'IDLE';
  
  private lastRepairTime = 0;
  private readonly REPAIR_RATE = 0.05;
  private locator!: IServiceLocator;
  private entitySystem!: EntitySystem;

  setup(locator: IServiceLocator): void {
    this.locator = locator;
    this.entitySystem = locator.getSystem<EntitySystem>('EntitySystem');
  }

  update(delta: number, time: number): void {
    this.repairState = 'IDLE';
    
    const store = useGameStore.getState();
    if (!store.isPlaying) return;
    
    const cursor = this.locator.getInputService().getCursor();
    
    // 1. PLAYER DOWN (Revival is always a REBOOT)
    if (store.playerHealth <= 0) {
        this.handleRevival(cursor, time, store);
        return; 
    }

    // 2. PANEL REPAIR
    this.handlePanelRepair(cursor, time, store);

    // 3. DECAY LOGIC
    if (time > this.lastRepairTime + this.REPAIR_RATE) {
        const decayFn = store.decayReboot;
        const panels = store.panels;
        for (const pKey in panels) {
            const p = panels[pKey];
            if (p.isDestroyed && p.health > 0) {
                 decayFn(p.id, 5);
            }
        }
    }
  }

  teardown(): void {}

  private handleRevival(cursor: {x: number, y: number}, time: number, store: any) {
    const identityPanel = store.panels['identity'];
    if (!identityPanel) return;

    const rect = ViewportHelper.getPanelWorldRect(identityPanel);
    if (!rect) return;

    const padding = 2.0; 
    const isHovering = 
        cursor.x >= rect.left - padding && 
        cursor.x <= rect.right + padding && 
        cursor.y >= rect.bottom - padding && 
        cursor.y <= rect.top + padding;

    if (isHovering) {
        this.repairState = 'REBOOTING'; // Reviving player is Purple
        
        if (time > this.lastRepairTime + this.REPAIR_RATE) {
            store.tickPlayerReboot(2.5);
            this.lastRepairTime = time;
            
            if (Math.random() > 0.5) {
                this.entitySystem.spawnParticle(cursor.x, cursor.y, '#9E4EA5', 1);
            }
        }
    } else {
        if (store.playerRebootProgress > 0 && time > this.lastRepairTime + this.REPAIR_RATE) {
            store.tickPlayerReboot(-2.0);
        }
    }
  }

  private handlePanelRepair(cursor: {x: number, y: number}, time: number, store: any) {
    const panels = store.panels;
    let hoveringPanelId: string | null = null;

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
        hoveringPanelId = p.id;
        break; 
      }
    }

    if (hoveringPanelId) {
        const p = panels[hoveringPanelId];
        
        // SET STATE BASED ON PANEL STATUS
        this.repairState = p.isDestroyed ? 'REBOOTING' : 'HEALING';

        if (time > this.lastRepairTime + this.REPAIR_RATE) {
            store.healPanel(p.id, 10);
            this.lastRepairTime = time;

            if (!p.isDestroyed) {
                GameEventBus.emit(GameEvents.PANEL_HEALED, { id: p.id, amount: 10 });
            }

            if (Math.random() > 0.6) {
                // Match particle color to state
                const color = p.isDestroyed ? '#9E4EA5' : '#00F0FF'; 
                this.entitySystem.spawnParticle(cursor.x, cursor.y, color, 1);
            }
        }
    }
  }
}
