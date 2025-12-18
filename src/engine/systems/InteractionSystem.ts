import { IInteractionSystem, IEntitySpawner, IGameStateSystem, IPanelSystem, IInputService, IGameEventService } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { useGameStore } from '@/engine/state/game/useGameStore';

export type RepairState = 'IDLE' | 'HEALING' | 'REBOOTING';

export class InteractionSystem implements IInteractionSystem {
  public repairState: RepairState = 'IDLE';
  public hoveringPanelId: string | null = null;
  
  private lastRepairTime = 0;
  private readonly REPAIR_RATE = 0.05;
  
  // Track previous ID to prevent store thrashing
  private previousHoverId: string | null = null;

  constructor(
    private input: IInputService,
    private spawner: IEntitySpawner,
    private gameSystem: IGameStateSystem,
    private panelSystem: IPanelSystem,
    private events: IGameEventService
  ) {}

  update(delta: number, time: number): void {
    this.repairState = 'IDLE';
    this.hoveringPanelId = null;
    
    if (this.gameSystem.isGameOver) {
        this.syncInteractionState();
        return; 
    }
    
    const cursor = this.input.getCursor();
    
    if (this.gameSystem.playerHealth <= 0) {
        this.handleRevival(cursor, time);
        
        if (this.repairState !== 'REBOOTING' && this.gameSystem.playerRebootProgress > 0) {
            this.events.emit(GameEvents.PLAYER_REBOOT_DECAY, { amount: delta * 15 });
        }
    } else {
        this.handlePanelRepair(cursor, time);
    }

    this.syncInteractionState();
  }

  private syncInteractionState() {
      // Only push to store if the target actually changed
      if (this.hoveringPanelId !== this.previousHoverId) {
          useGameStore.getState().setInteractionTarget(this.hoveringPanelId);
          this.previousHoverId = this.hoveringPanelId;
      }
  }

  teardown(): void {
      useGameStore.getState().setInteractionTarget(null);
  }

  private handleRevival(cursor: {x: number, y: number}, time: number) {
    const rect = this.panelSystem.getPanelRect('identity');
    if (!rect) return;
    
    const padding = 0.1; 
    
    const isHovering = 
        cursor.x >= rect.left - padding && 
        cursor.x <= rect.right + padding && 
        cursor.y >= rect.bottom - padding && 
        cursor.y <= rect.top + padding;

    if (isHovering) {
        this.hoveringPanelId = 'identity';
        this.repairState = 'REBOOTING';
        if (time > this.lastRepairTime + this.REPAIR_RATE) {
            this.events.emit(GameEvents.PLAYER_REBOOT_TICK, { amount: 4.0 });
            
            this.lastRepairTime = time;
            AudioSystem.playSound('loop_reboot'); 

            if (Math.random() > 0.3) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 2;
                this.spawner.spawnParticle(cursor.x, cursor.y, '#9E4EA5', Math.cos(angle)*speed, Math.sin(angle)*speed, 0.5);
            }
        }
    }
  }

  private handlePanelRepair(cursor: {x: number, y: number}, time: number) {
    const panels = this.panelSystem.getAllPanels();
    for (const p of panels) {
      if (cursor.x >= p.left && cursor.x <= p.right && cursor.y >= p.bottom && cursor.y <= p.top) {
        this.hoveringPanelId = p.id;
        
        if (!p.isDestroyed && p.health >= 100) continue;

        this.repairState = p.isDestroyed ? 'REBOOTING' : 'HEALING';

        if (time > this.lastRepairTime + this.REPAIR_RATE) {
            this.panelSystem.healPanel(p.id, 2.8, cursor.x); 
            this.lastRepairTime = time;
            
            if (p.isDestroyed) {
                AudioSystem.playSound('loop_reboot');
            } else {
                this.events.emit(GameEvents.PANEL_HEALED, { id: p.id, amount: 4 });
            }

            if (Math.random() > 0.3) {
                const color = p.isDestroyed ? '#9E4EA5' : '#00F0FF'; 
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 2;
                this.spawner.spawnParticle(cursor.x, cursor.y, color, Math.cos(angle)*speed, Math.sin(angle)*speed, 0.5);
            }
        }
        break; 
      }
    }
  }
}
