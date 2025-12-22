import { IInteractionSystem, IEntitySpawner, IGameStateSystem, IPanelSystem, IInputService, IGameEventService, IEntityRegistry, IPhysicsSystem } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { GAMEPLAY_CONFIG } from '@/engine/config/GameplayConfig';
import { PanelId } from '@/engine/config/PanelConfig';
import { PALETTE } from '@/engine/config/Palette';

export type RepairState = 'IDLE' | 'HEALING' | 'REBOOTING';

export class InteractionSystem implements IInteractionSystem {
  public repairState: RepairState = 'IDLE';
  public hoveringPanelId: PanelId | null = null;
  
  private lastRepairTime = 0;
  private previousHoverId: PanelId | null = null;

  constructor(
    private input: IInputService,
    private spawner: IEntitySpawner,
    private gameSystem: IGameStateSystem,
    private panelSystem: IPanelSystem,
    private events: IGameEventService,
    private physics: IPhysicsSystem,
    private registry: IEntityRegistry
  ) {}

  update(delta: number, time: number): void {
    this.repairState = 'IDLE';
    this.hoveringPanelId = null;
    
    const cursor = this.input.getCursor();

    // REMOVED: World Click Logic (Tap to Damage)
    
    if (this.gameSystem.isGameOver) {
        this.syncInteractionState();
        return; 
    }
    
    // Handle Continuous Interaction (Repair/Revive)
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
      if (this.hoveringPanelId !== this.previousHoverId) {
          useGameStore.getState().setInteractionTarget(this.hoveringPanelId);
          this.previousHoverId = this.hoveringPanelId;
      }
  }

  teardown(): void {
      useGameStore.getState().setInteractionTarget(null);
  }

  private handleRevival(cursor: {x: number, y: number}, time: number) {
    const rect = this.panelSystem.getPanelRect(PanelId.IDENTITY);
    if (!rect) return;
    
    const padding = 0.1; 
    const isHovering = 
        cursor.x >= rect.left - padding && 
        cursor.x <= rect.right + padding && 
        cursor.y >= rect.bottom - padding && 
        cursor.y <= rect.top + padding;

    if (isHovering) {
        this.hoveringPanelId = PanelId.IDENTITY;
        this.repairState = 'REBOOTING';
        if (time > this.lastRepairTime + GAMEPLAY_CONFIG.INTERACTION.REPAIR_RATE) {
            this.events.emit(GameEvents.PLAYER_REBOOT_TICK, { amount: GAMEPLAY_CONFIG.INTERACTION.REBOOT_TICK_AMOUNT });
            this.lastRepairTime = time;
            AudioSystem.playSound('loop_reboot'); 
            this.spawnRepairParticles(cursor, PALETTE.PURPLE.PRIMARY);
        }
    }
  }

  private handlePanelRepair(cursor: {x: number, y: number}, time: number) {
    const panelId = this.panelSystem.getPanelAt(cursor.x, cursor.y);

    if (panelId) {
        this.hoveringPanelId = panelId;

        const panelState = this.panelSystem.getPanelState(panelId);
        if (!panelState) return;

        if (!panelState.isDestroyed && panelState.health >= 100) return;

        this.repairState = panelState.isDestroyed ? 'REBOOTING' : 'HEALING';

        if (time > this.lastRepairTime + GAMEPLAY_CONFIG.INTERACTION.REPAIR_RATE) {
            this.panelSystem.healPanel(panelId, GAMEPLAY_CONFIG.INTERACTION.REPAIR_HEAL_AMOUNT, cursor.x);
            this.lastRepairTime = time;

            if (panelState.isDestroyed) {
                AudioSystem.playSound('loop_reboot');
            } else {
                this.events.emit(GameEvents.PANEL_HEALED, { id: panelId, amount: 4 });
            }

            const color = panelState.isDestroyed ? PALETTE.PURPLE.PRIMARY : PALETTE.CYAN.PRIMARY;
            this.spawnRepairParticles(cursor, color);
        }
    }
  }

  private spawnRepairParticles(cursor: {x: number, y: number}, color: string) {
      if (Math.random() > 0.3) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 2;
          this.spawner.spawnParticle(cursor.x, cursor.y, color, Math.cos(angle)*speed, Math.sin(angle)*speed, 0.5);
      }
  }
}
