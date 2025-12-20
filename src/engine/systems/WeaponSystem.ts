import { IGameSystem, IEntitySpawner, IGameStateSystem, IEntityRegistry, IGameEventService, IFastEventService } from '@/engine/interfaces';
import { Tag, Faction } from '@/engine/ecs/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { RenderModel } from '@/engine/ecs/components/RenderModel';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { GameEvents } from '@/engine/signals/GameEvents';
import { FastEventType, SoundCode, FXCode } from '@/engine/signals/FastEventBus';
import { ConfigService } from '@/engine/services/ConfigService';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { calculatePlayerShots } from '@/engine/handlers/weapons/WeaponLogic';
import { AI_STATE } from '@/engine/ai/AIStateTypes';

interface PurgeState {
    active: boolean;
    shotsRemaining: number;
    currentAngle: number;
}

export class WeaponSystem implements IGameSystem {
  private lastFireTime = 0;
  private unsubPurge: () => void;
  
  private purgeState: PurgeState = {
      active: false,
      shotsRemaining: 0,
      currentAngle: 0
  };

  constructor(
    private spawner: IEntitySpawner,
    private registry: IEntityRegistry,
    private gameSystem: IGameStateSystem,
    private events: IGameEventService,
    private fastEvents: IFastEventService,
    private config: typeof ConfigService
  ) {
    this.unsubPurge = this.events.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        if (p.option === 'PURGE') this.triggerPurge();
    });
  }

  update(delta: number, time: number): void {
    const isDead = this.gameSystem.isGameOver || this.gameSystem.playerHealth <= 0;

    if (isDead && !this.purgeState.active) {
        return;
    }

    let playerEntity = null;
    const players = this.registry.getByTag(Tag.PLAYER);
    for (const p of players) {
        const id = p.getComponent<IdentityData>(ComponentType.Identity);
        if (id && id.variant === 'PLAYER') {
            playerEntity = p; 
            break; 
        }
    }
    
    if (!playerEntity) return;

    // --- HANDLE PURGE SEQUENCE ---
    if (this.purgeState.active) {
        const transform = playerEntity.getComponent<TransformData>(ComponentType.Transform);
        if (transform) {
            this.processPurgeFrame(transform.x, transform.y);
        }
    }

    // --- HANDLE NORMAL FIRE ---
    if (this.purgeState.active || isDead) return;

    const stateComp = playerEntity.getComponent<AIStateData>(ComponentType.State);
    if (!stateComp || (stateComp.current !== AI_STATE.ACTIVE && stateComp.current !== AI_STATE.REBOOTING)) return;

    const upgrades = this.gameSystem.activeUpgrades;
    const currentFireRate = this.config.player.fireRate / Math.pow(1.5, upgrades['OVERCLOCK'] || 0);

    if (time > this.lastFireTime + currentFireRate) {
        const transform = playerEntity.getComponent<TransformData>(ComponentType.Transform);
        const renderModel = playerEntity.getComponent<RenderModel>(ComponentType.RenderModel);
        if (transform) {
            this.attemptAutoFire(time, transform, upgrades, renderModel);
        }
    }
  }

  private triggerPurge() {
      // 60 fps * 2 seconds * 3 shots per frame = 360 shots
      this.purgeState = {
          active: true,
          shotsRemaining: 360, 
          currentAngle: 0
      };

      const player = this.getPlayerEntity();
      if (player) {
          const t = player.getComponent<TransformData>(ComponentType.Transform);
          if (t) {
              this.fastEvents.emit(FastEventType.SPAWN_FX, FXCode.PURGE_BLAST, t.x * 100, t.y * 100, 0);
              this.fastEvents.emit(FastEventType.CAM_SHAKE, 50); 
          }
      }
  }

  private processPurgeFrame(originX: number, originY: number) {
      const SHOTS_PER_FRAME = 3;
      const ANGLE_INCREMENT = 0.4; 
      const SPEED = 24; // REDUCED: Was 35
      const DAMAGE = 50;
      const LIFE = 1.2;

      for (let i = 0; i < SHOTS_PER_FRAME; i++) {
          if (this.purgeState.shotsRemaining <= 0) {
              this.purgeState.active = false;
              break;
          }

          const angle = this.purgeState.currentAngle;
          const vx = Math.cos(angle) * SPEED;
          const vy = Math.sin(angle) * SPEED;

          this.spawner.spawnBullet(
              originX, originY, 
              vx, vy, 
              Faction.FRIENDLY, 
              LIFE, 
              DAMAGE, 
              'PLAYER_PURGE'
          );

          if (this.purgeState.shotsRemaining % 5 === 0) {
             this.fastEvents.emit(FastEventType.PLAY_SOUND, SoundCode.FX_PLAYER_FIRE, originX * 100);
          }

          this.purgeState.currentAngle += ANGLE_INCREMENT;
          this.purgeState.shotsRemaining--;
      }
  }

  private attemptAutoFire(time: number, pPos: TransformData, upgrades: Record<string, number>, pRender?: RenderModel) {
    const enemies = this.registry.getByTag(Tag.ENEMY);
    let nearestDist = Infinity; let targetEnemy = null;

    for (const e of enemies) {
      if (!e.active || e.hasTag(Tag.BULLET)) continue;
      const state = e.getComponent<AIStateData>(ComponentType.State);
      if (state && state.current === AI_STATE.SPAWN) continue;
      const t = e.getComponent<TransformData>(ComponentType.Transform);
      if (!t) continue;
      const dist = (t.x - pPos.x)**2 + (t.y - pPos.y)**2; 
      if (dist < 196 && dist < nearestDist) { nearestDist = dist; targetEnemy = e; }
    }

    if (!targetEnemy) return;

    const tPos = targetEnemy.getComponent<TransformData>(ComponentType.Transform)!;
    const shots = calculatePlayerShots({ x: pPos.x, y: pPos.y }, { x: tPos.x, y: tPos.y }, upgrades);

    shots.forEach(shot => {
        const bullet = this.spawner.spawnBullet(shot.x, shot.y, shot.vx, shot.vy, Faction.FRIENDLY, shot.life, shot.damage, shot.configId);
        if (pRender) {
            const bModel = bullet.getComponent<RenderModel>(ComponentType.RenderModel);
            if (bModel) { bModel.r = pRender.r * 4; bModel.g = pRender.g * 4; bModel.b = pRender.b * 4; }
        }
        if (shot.isHoming) {
            bullet.addComponent(new IdentityData('BULLET')); 
            bullet.addComponent(new TargetData(null, 'ENEMY'));
        }
    });

    this.fastEvents.emit(FastEventType.PLAY_SOUND, SoundCode.FX_PLAYER_FIRE, pPos.x * 100);
    this.lastFireTime = time;
  }

  private getPlayerEntity() {
      const players = this.registry.getByTag(Tag.PLAYER);
      for (const p of players) {
          const id = p.getComponent<IdentityData>(ComponentType.Identity);
          if (id && id.variant === 'PLAYER') return p;
      }
      return null;
  }

  teardown(): void {
    this.unsubPurge();
  }
}
