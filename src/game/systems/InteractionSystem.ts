import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { EntitySystem } from './EntitySystem';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { PanelRegistry } from './PanelRegistrySystem'; 
import { GameStateSystem } from './GameStateSystem'; 

export type RepairState = 'IDLE' | 'HEALING' | 'REBOOTING';

export class InteractionSystem implements IGameSystem {
  public repairState: RepairState = 'IDLE';
  public hoveringPanelId: string | null = null; // Exposed for UI Sync
  
  private lastRepairTime = 0;
  private readonly REPAIR_RATE = 0.05;
  private locator!: IServiceLocator;
  private entitySystem!: EntitySystem;
  private gameSystem!: GameStateSystem; 

  setup(locator: IServiceLocator): void {
    this.locator = locator;
    this.entitySystem = locator.getSystem<EntitySystem>('EntitySystem');
    this.gameSystem = locator.getSystem<GameStateSystem>('GameStateSystem');
  }

  update(delta: number, time: number): void {
    this.repairState = 'IDLE';
    this.hoveringPanelId = null;
    
    // STRICT CHECK: If game is over, disable interaction
    if (this.gameSystem.isGameOver) {
        return; 
    }
    
    const cursor = this.locator.getInputService().getCursor();
    
    // Player Dead logic (Revive Player)
    if (this.gameSystem.playerHealth <= 0) {
        this.handleRevival(cursor, time);
        return; 
    }

    // Panel Repair Logic
    this.handlePanelRepair(cursor, time);
    
    // Decay Logic for destroyed panels
    if (time > this.lastRepairTime + this.REPAIR_RATE) {
        const panels = PanelRegistry.getAllPanels();
        for (const p of panels) {
            if (p.isDestroyed && p.health > 0) {
                 PanelRegistry.decayPanel(p.id, 5);
            }
        }
    }
  }

  teardown(): void {}

  private handleRevival(cursor: {x: number, y: number}, time: number) {
    const rect = PanelRegistry.getPanelRect('identity');
    if (!rect) return;
    const padding = 2.0; 
    const isHovering = 
        cursor.x >= rect.left - padding && 
        cursor.x <= rect.right + padding && 
        cursor.y >= rect.bottom - padding && 
        cursor.y <= rect.top + padding;

    if (isHovering) {
        this.hoveringPanelId = 'identity'; // Consider self-repair as hovering identity
        this.repairState = 'REBOOTING';
        if (time > this.lastRepairTime + this.REPAIR_RATE) {
            this.gameSystem.tickReboot(2.5);
            this.lastRepairTime = time;
            if (Math.random() > 0.3) this.entitySystem.spawnParticle(cursor.x, cursor.y, '#9E4EA5', 4);
        }
    } else {
        if (this.gameSystem.playerRebootProgress > 0 && time > this.lastRepairTime + this.REPAIR_RATE) {
            this.gameSystem.tickReboot(-2.0);
        }
    }
  }

  private handlePanelRepair(cursor: {x: number, y: number}, time: number) {
    const panels = PanelRegistry.getAllPanels();
    
    for (const p of panels) {
      // Logic: Is mouse inside?
      if (cursor.x >= p.left && cursor.x <= p.right && cursor.y >= p.bottom && cursor.y <= p.top) {
        this.hoveringPanelId = p.id;
        
        // Only trigger repair/logic if needed
        if (!p.isDestroyed && p.health >= 1000) continue;

        this.repairState = p.isDestroyed ? 'REBOOTING' : 'HEALING';

        if (time > this.lastRepairTime + this.REPAIR_RATE) {
            PanelRegistry.healPanel(p.id, 10);
            this.lastRepairTime = time;
            if (!p.isDestroyed) GameEventBus.emit(GameEvents.PANEL_HEALED, { id: p.id, amount: 10 });
            if (Math.random() > 0.3) {
                const color = p.isDestroyed ? '#9E4EA5' : '#00F0FF'; 
                this.entitySystem.spawnParticle(cursor.x, cursor.y, color, 4);
            }
        }
        break; 
      }
    }
  }
}
