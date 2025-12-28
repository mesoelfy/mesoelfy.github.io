import { IInteractionSystem, IEntitySpawner, IGameStateSystem, IPanelSystem, IInputService, IGameEventService, IEntityRegistry, IPhysicsSystem } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { GAMEPLAY_CONFIG } from '@/engine/config/GameplayConfig';
import { PanelId } from '@/engine/config/PanelConfig';
import { PALETTE } from '@/engine/config/Palette';
import { GameStream } from '@/engine/state/GameStream';

export type RepairState = 'IDLE' | 'HEALING' | 'REBOOTING';

export class InteractionSystem implements IInteractionSystem {
  public repairState: RepairState = 'IDLE';
  public hoveringPanelId: PanelId | null = null;
  
  private lastRepairTime = 0;
  private previousHoverId: PanelId | null = null;
  private isTonePlaying = false; // Track tone state

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
    let interactionCode = 0;
    
    const cursor = this.input.getCursor();

    if (this.gameSystem.isGameOver) {
        this.syncInteractionState();
        GameStream.set('PLAYER_INTERACTION_STATE', 0);
        this.manageTone(false);
        return; 
    }
    
    // 1. Check Identity Core Interaction
    const identityRect = this.panelSystem.getPanelRect(PanelId.IDENTITY);
    
    if (identityRect) {
        const padding = 0.5; 
        const isHoveringIdentity = 
            cursor.x >= identityRect.left - padding && 
            cursor.x <= identityRect.right + padding && 
            cursor.y >= identityRect.bottom - padding && 
            cursor.y <= identityRect.top + padding;

        if (isHoveringIdentity) {
            const isPlayerDead = this.gameSystem.playerHealth <= 0;
            const isPanelDead = this.panelSystem.getPanelState(PanelId.IDENTITY)?.isDestroyed ?? false;
            const isHealthFull = this.gameSystem.playerHealth >= this.gameSystem.maxPlayerHealth;

            if (isPlayerDead) {
                this.hoveringPanelId = PanelId.IDENTITY;
                this.repairState = 'REBOOTING';
                interactionCode = 2; 
                
                if (time > this.lastRepairTime + GAMEPLAY_CONFIG.INTERACTION.REPAIR_RATE) {
                    this.events.emit(GameEvents.PLAYER_REBOOT_TICK, { amount: GAMEPLAY_CONFIG.INTERACTION.REBOOT_TICK_AMOUNT });
                    this.lastRepairTime = time;
                    AudioSystem.playSound('loop_reboot'); 
                    this.spawnRepairParticles(cursor, PALETTE.PURPLE.PRIMARY);
                }
            } 
            else if (!isPanelDead && !isHealthFull) {
                this.hoveringPanelId = PanelId.IDENTITY;
                this.repairState = 'HEALING';
                interactionCode = 1; 
                
                if (time > this.lastRepairTime + GAMEPLAY_CONFIG.INTERACTION.REPAIR_RATE) {
                    this.gameSystem.healPlayer(GAMEPLAY_CONFIG.INTERACTION.REPAIR_HEAL_AMOUNT);
                    this.lastRepairTime = time;
                    this.spawnRepairParticles(cursor, PALETTE.YELLOW.GOLD);
                }
            }
        }
    }

    // 2. Check Other Panels (Standard Repair)
    if (!this.hoveringPanelId) {
        const panelId = this.panelSystem.getPanelAt(cursor.x, cursor.y);
        
        if (panelId) {
            const panelState = this.panelSystem.getPanelState(panelId);
            if (panelState && panelId !== PanelId.IDENTITY) {
                if (panelState.isDestroyed || panelState.health < 100) {
                    this.hoveringPanelId = panelId;
                    this.repairState = panelState.isDestroyed ? 'REBOOTING' : 'HEALING';
                    
                    if (time > this.lastRepairTime + GAMEPLAY_CONFIG.INTERACTION.REPAIR_RATE) {
                        this.panelSystem.healPanel(panelId, GAMEPLAY_CONFIG.INTERACTION.REPAIR_HEAL_AMOUNT, cursor.x);
                        this.lastRepairTime = time;

                        if (panelState.isDestroyed) {
                            AudioSystem.playSound('loop_reboot');
                        } else {
                            this.events.emit(GameEvents.PANEL_HEALED, { id: panelId, amount: 4 });
                        }

                        const color = panelState.isDestroyed ? PALETTE.PURPLE.PRIMARY : PALETTE.PINK.PRIMARY;
                        this.spawnRepairParticles(cursor, color);
                    }
                }
            }
        }
    }

    // 3. TONE MANAGEMENT
    // Play Shepard Tone if Self-Healing (interactionCode 1) or Reviving (interactionCode 2)
    // Note: Standard panel healing doesn't trigger the Shepard Tone, it uses 'loop_heal' event.
    this.manageTone(interactionCode === 1 || interactionCode === 2);

    // 4. Revive Decay
    if (this.gameSystem.playerHealth <= 0 && this.repairState !== 'REBOOTING' && this.gameSystem.playerRebootProgress > 0) {
        this.events.emit(GameEvents.PLAYER_REBOOT_DECAY, { amount: delta * 15 });
    }

    this.syncInteractionState();
    GameStream.set('PLAYER_INTERACTION_STATE', interactionCode);
  }

  private manageTone(shouldPlay: boolean) {
      if (shouldPlay && !this.isTonePlaying) {
          AudioSystem.startHealingTone();
          this.isTonePlaying = true;
      } else if (!shouldPlay && this.isTonePlaying) {
          AudioSystem.stopHealingTone();
          this.isTonePlaying = false;
      }
  }

  private syncInteractionState() {
      if (this.hoveringPanelId !== this.previousHoverId) {
          useGameStore.getState().setInteractionTarget(this.hoveringPanelId);
          this.previousHoverId = this.hoveringPanelId;
      }
  }

  teardown(): void {
      useGameStore.getState().setInteractionTarget(null);
      this.manageTone(false);
  }

  private spawnRepairParticles(cursor: {x: number, y: number}, color: string) {
      if (Math.random() > 0.3) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 2;
          this.spawner.spawnParticle(cursor.x, cursor.y, color, Math.cos(angle)*speed, Math.sin(angle)*speed, 0.5);
      }
  }
}
