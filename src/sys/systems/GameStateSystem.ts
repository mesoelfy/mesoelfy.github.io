import { IGameSystem, IServiceLocator, IGameStateSystem, IPanelSystem, IEntityRegistry } from '@/engine/interfaces';
import { PLAYER_CONFIG } from '@/sys/config/PlayerConfig';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { useStore } from '@/sys/state/global/useStore'; 
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { RenderData } from '@/sys/data/RenderData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { Tag } from '@/engine/ecs/types';
import * as THREE from 'three';

// Constants for World Colors
const COL_SAFE = new THREE.Color("#003300"); // Dark Green
const COL_WARN = new THREE.Color("#4d3300"); // Dark Yellow
const COL_CRIT = new THREE.Color("#4d0000"); // Dark Red
const COL_SBX  = new THREE.Color("#001a33"); // Sandbox Blue

export class GameStateSystem implements IGameStateSystem {
  public playerHealth: number = PLAYER_CONFIG.maxHealth;
  public maxPlayerHealth: number = PLAYER_CONFIG.maxHealth;
  public playerRebootProgress: number = 0;
  
  public score: number = 0;
  public xp: number = 0;
  public level: number = 1;
  public xpToNextLevel: number = PLAYER_CONFIG.baseXpRequirement;
  public upgradePoints: number = 0;

  public activeUpgrades: Record<string, number> = {
    'OVERCLOCK': 0, 'EXECUTE': 0, 'FORK': 0,
    'SNIFFER': 0, 'BACKDOOR': 0, 'REPAIR_NANITES': 0
  };

  public isGameOver: boolean = false;
  
  private heartbeatTimer: number = 0;
  private panelSystem!: IPanelSystem;
  private registry!: IEntityRegistry;
  
  // Reusable lerp helpers
  private targetColor = new THREE.Color();
  private currentColor = new THREE.Color();

  setup(locator: IServiceLocator): void {
    this.panelSystem = locator.getSystem<IPanelSystem>('PanelRegistrySystem');
    this.registry = locator.getRegistry();
    this.reset();
    GameEventBus.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        this.applyUpgrade(p.option);
    });
  }

  update(delta: number, time: number): void {
      if (this.isGameOver) return;

      const integrity = this.panelSystem.systemIntegrity;
      
      // --- HEARTBEAT LOGIC ---
      if (integrity < 30 && integrity > 0) {
          this.heartbeatTimer -= delta;
          if (this.heartbeatTimer <= 0) {
              const urgency = 1.0 - (integrity / 30);
              AudioSystem.playSound('loop_warning');
              GameEventBus.emit(GameEvents.HEARTBEAT, { urgency });
              this.heartbeatTimer = 1.4 - (urgency * 1.05); 
          }
      } else {
          this.heartbeatTimer = 0;
      }

      // --- WORLD VISUAL UPDATE (ECS Driven) ---
      const worldEntities = this.registry.getByTag(Tag.WORLD);
      for (const world of worldEntities) {
          const render = world.getComponent<RenderData>(ComponentType.Render);
          if (render) {
              const bootState = useStore.getState().bootState;
              
              if (bootState === 'sandbox') this.targetColor.copy(COL_SBX);
              else if (integrity < 30) this.targetColor.copy(COL_CRIT);
              else if (integrity < 60) this.targetColor.copy(COL_WARN);
              else this.targetColor.copy(COL_SAFE);

              // Smooth Lerp
              this.currentColor.setRGB(render.r, render.g, render.b);
              this.currentColor.lerp(this.targetColor, delta * 3.0);
              
              render.r = this.currentColor.r;
              render.g = this.currentColor.g;
              render.b = this.currentColor.b;
              
              // Scroll Speed (Visual Rotation used as Z-Scroll Offset)
              // This drives the matrix grid scrolling in the shader
              // 0.5 is base speed
              render.visualRotation += 0.5 * delta; 
          }
      }
  }

  teardown(): void {}

  public reset() {
    this.playerHealth = this.maxPlayerHealth;
    this.playerRebootProgress = 0;
    this.score = 0;
    this.xp = 0;
    this.level = 1;
    this.xpToNextLevel = PLAYER_CONFIG.baseXpRequirement;
    this.upgradePoints = 0;
    this.isGameOver = false;
    this.activeUpgrades = { 
        'OVERCLOCK': 0, 'EXECUTE': 0, 'FORK': 0,
        'SNIFFER': 0, 'BACKDOOR': 0, 'REPAIR_NANITES': 0
    };
  }

  public applyUpgrade(option: string) {
      if (this.upgradePoints > 0) {
          this.upgradePoints--;
          if (option === 'PURGE' || option === 'RESTORE') return;
          if (option === 'DAEMON') {
              GameEventBus.emit(GameEvents.SPAWN_DAEMON, null);
              return; 
          }
          this.activeUpgrades[option] = (this.activeUpgrades[option] || 0) + 1;
          if (option === 'REPAIR_NANITES') this.healPlayer(this.maxPlayerHealth * 0.2);
      }
  }

  public damagePlayer(amount: number) {
    if (this.isGameOver) return;
    const { godMode } = useStore.getState().debugFlags;
    if (godMode) return;
    
    if (this.playerHealth > 0) {
        this.playerHealth = Math.max(0, this.playerHealth - amount);
        if (this.playerHealth <= 0) AudioSystem.playSound('fx_player_death');
    } else {
        this.playerRebootProgress = Math.max(0, this.playerRebootProgress - (amount * 2));
    }
  }

  public healPlayer(amount: number) {
    this.playerHealth = Math.min(this.maxPlayerHealth, this.playerHealth + amount);
  }

  public addScore(amount: number) {
    this.score += amount;
  }

  public addXp(amount: number) {
    this.xp += amount;
    while (this.xp >= this.xpToNextLevel) {
        this.xp -= this.xpToNextLevel;
        this.level++;
        this.upgradePoints++;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * PLAYER_CONFIG.xpScalingFactor);
        GameEventBus.emit(GameEvents.THREAT_LEVEL_UP, { level: this.level });
    }
  }

  public tickReboot(amount: number) {
    if (this.playerHealth > 0) return;
    this.playerRebootProgress = Math.max(0, Math.min(100, this.playerRebootProgress + amount));
    
    if (this.playerRebootProgress >= 100) {
        this.playerHealth = this.maxPlayerHealth; 
        this.playerRebootProgress = 0;
        AudioSystem.playSound('fx_reboot_success'); 
    }
  }

  public decayReboot(amount: number) {
      if (this.playerHealth > 0) return; 
      this.playerRebootProgress = Math.max(0, this.playerRebootProgress - amount);
  }
}
