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
        return; 
    }
    
    let handledByCrystal = false;
    const identityRect = this.panelSystem.getPanelRect(PanelId.IDENTITY);
    
    if (identityRect) {
        const zoneRadius = 2.2; 
        const zoneX = identityRect.x; 
        const zoneY = identityRect.top - 2.8; 
        
        const distSq = (cursor.x - zoneX)**2 + (cursor.y - zoneY)**2;
        const isHoveringCrystal = distSq < (zoneRadius * zoneRadius);

        if (isHoveringCrystal) {
            const isPlayerDead = this.gameSystem.playerHealth <= 0;
            const isPlayerHurt = this.gameSystem.playerHealth < this.gameSystem.maxPlayerHealth;
            
            const panelState = this.panelSystem.getPanelState(PanelId.IDENTITY);
            const isPanelDead = panelState?.isDestroyed ?? false;

            if (isPlayerDead) {
                this.hoveringPanelId = PanelId.IDENTITY;
                this.repairState = 'REBOOTING';
                interactionCode = 2; 
                handledByCrystal = true;
                
                if (time > this.lastRepairTime + GAMEPLAY_CONFIG.INTERACTION.REPAIR_RATE) {
                    this.events.emit(GameEvents.PLAYER_REBOOT_TICK, { amount: GAMEPLAY_CONFIG.INTERACTION.REBOOT_TICK_AMOUNT });
                    this.lastRepairTime = time;
                    AudioSystem.playSound('loop_reboot'); 
                    this.spawnRepairParticles(cursor, PALETTE.PURPLE.PRIMARY);
                }
            } 
            else if (isPlayerHurt && !isPanelDead) {
                this.hoveringPanelId = PanelId.IDENTITY;
                this.repairState = 'HEALING';
                interactionCode = 1; 
                handledByCrystal = true;
                
                if (time > this.lastRepairTime + GAMEPLAY_CONFIG.INTERACTION.REPAIR_RATE) {
                    this.gameSystem.healPlayer(GAMEPLAY_CONFIG.INTERACTION.SELF_HEAL_AMOUNT);
                    this.lastRepairTime = time;
                    this.spawnRepairParticles(cursor, PALETTE.YELLOW.GOLD);
                    AudioSystem.playSound('loop_heal_high'); 
                }
            }
        }
    }

    if (!handledByCrystal) {
        const panelId = this.panelSystem.getPanelAt(cursor.x, cursor.y);
        
        if (panelId) {
            const panelState = this.panelSystem.getPanelState(panelId);
            if (panelState) {
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

    if (this.gameSystem.playerHealth <= 0 && this.repairState !== 'REBOOTING' && this.gameSystem.playerRebootProgress > 0) {
        this.events.emit(GameEvents.PLAYER_REBOOT_DECAY, { amount: delta * 15 });
    }

    this.syncInteractionState();
    GameStream.set('PLAYER_INTERACTION_STATE', interactionCode);
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

  private spawnRepairParticles(cursor: {x: number, y: number}, color: string) {
      if (Math.random() > 0.3) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 2;
          this.spawner.spawnParticle(cursor.x, cursor.y, color, Math.cos(angle)*speed, Math.sin(angle)*speed, 0.5);
      }
  }
}
