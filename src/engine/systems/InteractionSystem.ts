import { IInteractionSystem, IEntitySpawner, IGameStateSystem, IPanelSystem, IInputService, IGameEventService, IEntityRegistry, IPhysicsSystem } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { ColliderData } from '@/engine/ecs/components/ColliderData';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { Tag } from '@/engine/ecs/types';
import { GAMEPLAY_CONFIG } from '@/engine/config/GameplayConfig';

export type RepairState = 'IDLE' | 'HEALING' | 'REBOOTING';

export class InteractionSystem implements IInteractionSystem {
  public repairState: RepairState = 'IDLE';
  public hoveringPanelId: string | null = null;
  
  private lastRepairTime = 0;
  private previousHoverId: string | null = null;

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
        if (time > this.lastRepairTime + GAMEPLAY_CONFIG.INTERACTION.REPAIR_RATE) {
            this.events.emit(GameEvents.PLAYER_REBOOT_TICK, { amount: GAMEPLAY_CONFIG.INTERACTION.REBOOT_TICK_AMOUNT });
            this.lastRepairTime = time;
            AudioSystem.playSound('loop_reboot'); 
            this.spawnRepairParticles(cursor, '#9E4EA5');
        }
    }
  }

  private handlePanelRepair(cursor: {x: number, y: number}, time: number) {
    const panels = this.registry.getByTag(Tag.OBSTACLE);

    for (const entity of panels) {
        if (!entity.active) continue;

        const transform = entity.getComponent<TransformData>(ComponentType.Transform);
        const collider = entity.getComponent<ColliderData>(ComponentType.Collider);
        const identity = entity.getComponent<IdentityData>(ComponentType.Identity);

        if (!transform || !collider || !identity) continue;

        // Precise AABB Check
        const halfW = collider.width / 2;
        const halfH = collider.height / 2;
        
        const inX = cursor.x >= transform.x - halfW && cursor.x <= transform.x + halfW;
        const inY = cursor.y >= transform.y - halfH && cursor.y <= transform.y + halfH;

        if (inX && inY) {
            const panelId = identity.variant;
            this.hoveringPanelId = panelId;

            const panelState = this.panelSystem.getPanelState(panelId);
            if (!panelState) continue;

            if (!panelState.isDestroyed && panelState.health >= 100) continue;

            this.repairState = panelState.isDestroyed ? 'REBOOTING' : 'HEALING';

            if (time > this.lastRepairTime + GAMEPLAY_CONFIG.INTERACTION.REPAIR_RATE) {
                this.panelSystem.healPanel(panelId, GAMEPLAY_CONFIG.INTERACTION.REPAIR_HEAL_AMOUNT, cursor.x);
                this.lastRepairTime = time;

                if (panelState.isDestroyed) {
                    AudioSystem.playSound('loop_reboot');
                } else {
                    this.events.emit(GameEvents.PANEL_HEALED, { id: panelId, amount: 4 });
                }

                const color = panelState.isDestroyed ? '#9E4EA5' : '#00F0FF';
                this.spawnRepairParticles(cursor, color);
            }
            break; 
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
