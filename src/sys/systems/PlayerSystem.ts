import { IGameSystem, IServiceLocator, IEntitySpawner, IGameStateSystem, IInteractionSystem } from '@/engine/interfaces';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { Tag } from '@/engine/ecs/types';
import { TransformData } from '@/sys/data/TransformData';
import { AIStateData } from '@/sys/data/AIStateData';
import { TargetData } from '@/sys/data/TargetData';
import { RenderData } from '@/sys/data/RenderData';
import { ConfigService } from '@/sys/services/ConfigService';
import { FastEventBus, FastEvents, FX_IDS } from '@/engine/signals/FastEventBus';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { GAME_THEME } from '@/ui/sim/config/theme';
import * as THREE from 'three';

// Helpers
const COL_BASE = new THREE.Color(GAME_THEME.turret.base);
const COL_REPAIR = new THREE.Color(GAME_THEME.turret.repair);
const COL_REBOOT = new THREE.Color('#9E4EA5');
const COL_DEAD = new THREE.Color('#FF003C');

export class PlayerSystem implements IGameSystem {
  private lastFireTime = 0;
  private gameSystem!: IGameStateSystem;
  private registry!: EntityRegistry;
  private spawner!: IEntitySpawner;
  private locator!: IServiceLocator;
  private config!: typeof ConfigService;
  
  private tempColor = new THREE.Color();

  setup(locator: IServiceLocator): void {
    this.locator = locator;
    this.gameSystem = locator.getSystem<IGameStateSystem>('GameStateSystem');
    this.registry = locator.getRegistry() as EntityRegistry;
    this.spawner = locator.getSpawner();
    this.config = locator.getConfigService();
    
    this.setupListeners();
  }

  update(delta: number, time: number): void {
    let playerEntity = null;
    for (const p of this.registry.getByTag(Tag.PLAYER)) {
        playerEntity = p;
        break;
    }
    
    if (!playerEntity) return;

    // --- VISUAL STATE ---
    const render = playerEntity.getComponent<RenderData>(ComponentType.Render);
    const transform = playerEntity.getComponent<TransformData>(ComponentType.Transform);
    const cursor = this.locator.getInputService().getCursor();

    if (transform) {
        transform.x = cursor.x;
        transform.y = cursor.y;
    }

    if (render) {
        let targetCol = COL_BASE;
        let spinSpeed = -0.02;
        
        let interactState = 'IDLE';
        try {
            const interact = this.locator.getSystem<IInteractionSystem>('InteractionSystem');
            interactState = interact.repairState;
        } catch {}

        if (this.gameSystem.playerHealth <= 0) {
            targetCol = COL_DEAD;
            if (interactState === 'REBOOTING') {
                targetCol = COL_REBOOT;
                spinSpeed = -10.0;
            } else {
                spinSpeed = 1.5;
            }
        } else {
            if (interactState === 'HEALING') {
                targetCol = COL_REPAIR;
                spinSpeed = 0.4;
            }
        }

        this.tempColor.setRGB(render.r, render.g, render.b);
        this.tempColor.lerp(targetCol, delta * 3.0);
        render.r = this.tempColor.r;
        render.g = this.tempColor.g;
        render.b = this.tempColor.b;
        render.visualRotation += spinSpeed;
        
        if (interactState !== 'IDLE' && this.gameSystem.playerHealth > 0) {
            render.visualScale = 1.2 + Math.sin(time * 20) * 0.2;
        } else {
            render.visualScale = 1.0;
        }
    }

    if (this.gameSystem.isGameOver || this.gameSystem.playerHealth <= 0) return;

    // --- LOGIC ---
    const stateComp = playerEntity.getComponent<AIStateData>(ComponentType.State);
    if (stateComp) {
        try {
            const interact = this.locator.getSystem<IInteractionSystem>('InteractionSystem');
            stateComp.current = interact.repairState !== 'IDLE' ? 'REBOOTING' : 'ACTIVE';
        } catch {
            stateComp.current = 'ACTIVE';
        }
    }

    if (stateComp && (stateComp.current === 'ACTIVE' || stateComp.current === 'REBOOTING')) {
        const upgrades = this.gameSystem.activeUpgrades;
        const overclock = upgrades['OVERCLOCK'] || 0;
        const currentFireRate = this.config.player.fireRate / Math.pow(1.5, overclock);

        if (time > this.lastFireTime + currentFireRate) {
            this.attemptAutoFire(time, playerEntity, upgrades);
        }
    }
  }

  teardown(): void {}

  private setupListeners() {
    GameEventBus.subscribe(GameEvents.ENEMY_DESTROYED, () => {
      this.gameSystem.addScore(1);
      this.gameSystem.addXp(10);
    });

    GameEventBus.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        if (p.option === 'PURGE') {
            this.triggerPurge();
        }
    });
  }

  private triggerPurge() {
      const cursor = this.locator.getInputService().getCursor();
      const count = 360; 
      const speed = 45;  
      const damage = 100;

      FastEventBus.emit(FastEvents.SPAWN_FX, FX_IDS['EXPLOSION_YELLOW'], cursor.x, cursor.y);
      GameEventBus.emit(GameEvents.TRAUMA_ADDED, { amount: 1.0 }); 

      for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count;
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;
          
          this.spawner.spawnBullet(
              cursor.x, cursor.y, 
              vx, vy, 
              false, 
              2.0,   
              damage, 
              'PLAYER_PURGE'
          );
      }
  }

  private attemptAutoFire(time: number, player: any, upgrades: Record<string, number>) {
    const cursor = this.locator.getInputService().getCursor();
    const enemies = this.registry.getByTag(Tag.ENEMY);
    let nearestDist = Infinity;
    const RANGE = 14; 
    let targetEnemy: any = null;

    for (const e of enemies) {
      if (!e.active) continue;
      if (e.hasTag(Tag.BULLET)) continue;

      const state = e.getComponent<AIStateData>(ComponentType.State);
      if (state && state.current === 'SPAWN') continue;

      const t = e.getComponent<TransformData>(ComponentType.Transform);
      if (!t) continue;
      const dx = t.x - cursor.x;
      const dy = t.y - cursor.y;
      const dist = dx*dx + dy*dy; 
      if (dist < (RANGE * RANGE) && dist < nearestDist) {
          nearestDist = dist;
          targetEnemy = e;
      }
    }

    if (targetEnemy) {
      const forkLevel = upgrades['FORK'] || 0;
      const projectileCount = 1 + (forkLevel * 2);
      const dmgLevel = upgrades['EXECUTE'] || 0;
      const damage = 1 + dmgLevel;
      const snifferLevel = upgrades['SNIFFER'] || 0;
      const backdoorLevel = upgrades['BACKDOOR'] || 0;

      // Determine Weapon Type ID
      let configId = 'PLAYER_STANDARD';
      if (forkLevel > 0) configId = 'PLAYER_FORK';
      
      // Sniffer overrides Fork visually if both present (prioritize tech)
      if (snifferLevel > 0) configId = 'PLAYER_SNIFFER';

      const baseSpread = 0.15;
      const spreadAngle = baseSpread; 
      
      const tPos = targetEnemy.getComponent<TransformData>(ComponentType.Transform)!;
      const dx = tPos.x - cursor.x;
      const dy = tPos.y - cursor.y;
      const baseAngle = Math.atan2(dy, dx);
      const startAngle = baseAngle - ((projectileCount - 1) * spreadAngle) / 2;

      const bSpeed = this.config.player.bulletSpeed;
      const bLife = this.config.player.bulletLife;

      // FORK / STANDARD
      for (let i = 0; i < projectileCount; i++) {
          const angle = startAngle + (i * spreadAngle);
          const vx = Math.cos(angle) * bSpeed;
          const vy = Math.sin(angle) * bSpeed;
          this.spawner.spawnBullet(cursor.x, cursor.y, vx, vy, false, bLife, damage, configId);
      }

      // BACKDOOR
      if (backdoorLevel > 0) {
          const rearAngle = baseAngle + Math.PI; 
          const vx = Math.cos(rearAngle) * bSpeed;
          const vy = Math.sin(rearAngle) * bSpeed;
          this.spawner.spawnBullet(cursor.x, cursor.y, vx, vy, false, bLife, damage, 'PLAYER_BACKDOOR');
      }

      // SNIFFER
      // Spawns ADDITIONAL bullets if Sniffer is active
      if (snifferLevel > 0) {
          const angleStep = (Math.PI * 2) / snifferLevel;
          for(let i=0; i<snifferLevel; i++) {
              const angle = baseAngle + (i * angleStep);
              const vx = Math.cos(angle) * bSpeed;
              const vy = Math.sin(angle) * bSpeed;
              // Sniffers are separate shots
              const bullet = this.spawner.spawnBullet(cursor.x, cursor.y, vx, vy, false, bLife, damage, 'PLAYER_SNIFFER');
              bullet.addComponent(new TargetData(null, 'ENEMY'));
          }
      }
      
      FastEventBus.emit(FastEvents.PLAY_SOUND, FX_IDS['FX_PLAYER_FIRE'], cursor.x || 0);
      this.lastFireTime = time;
    }
  }
}
