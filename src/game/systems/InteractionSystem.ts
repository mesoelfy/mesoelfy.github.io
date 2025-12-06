import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { EntitySystem } from './EntitySystem';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { PanelRegistry } from './PanelRegistrySystem'; 
import { GameStateSystem } from './GameStateSystem'; 

export type RepairState = 'IDLE' | 'HEALING' | 'REBOOTING';

export class InteractionSystem implements IGameSystem {
  public repairState: RepairState = 'IDLE';
  
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
    
    // FIX: Strictly return if Game Over
    if (this.gameSystem.isGameOver) {
        return; 
    }
    
    const cursor = this.locator.getInputService().getCursor();
    
    // Player Dead logic (but not Game Over)
    if (this.gameSystem.playerHealth <= 0) {
        this.handleRevival(cursor, time);
        return; 
    }

    this.handlePanelRepair(cursor, time);
    
    // Decay Logic
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
    let hoveringPanelId: string | null = null;

    for (const p of panels) {
      if (!p.isDestroyed && p.health >= 1000) continue;
      if (cursor.x >= p.left && cursor.x <= p.right && cursor.y >= p.bottom && cursor.y <= p.top) {
        hoveringPanelId = p.id;
        break; 
      }
    }

    if (hoveringPanelId) {
        const state = PanelRegistry.getPanelState(hoveringPanelId);
        if (!state) return;
        
        // Don't allow healing identity if it's dead (Game Over handles this, but safety check)
        if (hoveringPanelId === 'identity' && state.isDestroyed) return;

        this.repairState = state.isDestroyed ? 'REBOOTING' : 'HEALING';

        if (time > this.lastRepairTime + this.REPAIR_RATE) {
            PanelRegistry.healPanel(hoveringPanelId, 10);
            this.lastRepairTime = time;
            if (!state.isDestroyed) GameEventBus.emit(GameEvents.PANEL_HEALED, { id: hoveringPanelId, amount: 10 });
            if (Math.random() > 0.3) {
                const color = state.isDestroyed ? '#9E4EA5' : '#00F0FF'; 
                this.entitySystem.spawnParticle(cursor.x, cursor.y, color, 4);
            }
        }
    }
  }
}
