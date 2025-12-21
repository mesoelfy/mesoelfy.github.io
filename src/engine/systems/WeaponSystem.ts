import { IGameSystem, IEntitySpawner, IGameStateSystem, IEntityRegistry, IGameEventService } from '@/engine/interfaces';
import { Tag, Faction } from '@/engine/ecs/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { RenderModel } from '@/engine/ecs/components/RenderModel';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { GameEvents } from '@/engine/signals/GameEvents';
import { ConfigService } from '@/engine/services/ConfigService';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { calculatePlayerShots } from '@/engine/handlers/weapons/WeaponLogic';
import { AI_STATE } from '@/engine/ai/AIStateTypes';
import { WeaponIDs, ArchetypeID } from '@/engine/config/Identifiers';
import * as THREE from 'three';

interface PurgeState {
    active: boolean;
    shotsRemaining: number;
    currentAngle: number;
    accumulator: number;
}

export class WeaponSystem implements IGameSystem {
  private lastFireTime = 0;
  private unsubPurge: () => void;
  private tempColor = new THREE.Color();
  
  private purgeState: PurgeState = {
      active: false, shotsRemaining: 0, currentAngle: 0, accumulator: 0
  };

  constructor(
    private spawner: IEntitySpawner,
    private registry: IEntityRegistry,
    private gameSystem: IGameStateSystem,
    private events: IGameEventService,
    private config: typeof ConfigService
  ) {
    this.unsubPurge = this.events.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        if (p.option === 'PURGE') this.triggerPurge();
        if (p.option === 'NOVA') this.triggerNova();
    });
  }

  update(delta: number, time: number): void {
    const isDead = this.gameSystem.isGameOver || this.gameSystem.playerHealth <= 0;
    if (isDead && !this.purgeState.active) return;

    const playerEntity = this.getPlayerEntity();
    if (!playerEntity) return;

    if (this.purgeState.active) {
        const transform = playerEntity.getComponent<TransformData>(ComponentType.Transform);
        if (transform) this.processPurgeFrame(delta, transform.x, transform.y);
    }

    if (this.purgeState.active || isDead) return;

    const stateComp = playerEntity.getComponent<AIStateData>(ComponentType.State);
    if (!stateComp || (stateComp.current !== AI_STATE.ACTIVE && stateComp.current !== AI_STATE.REBOOTING)) return;

    const upgrades = this.gameSystem.activeUpgrades;
    const currentFireRate = this.config.player.fireRate / Math.pow(1.5, upgrades['OVERCLOCK'] || 0);

    if (time > this.lastFireTime + currentFireRate) {
        const transform = playerEntity.getComponent<TransformData>(ComponentType.Transform);
        const renderModel = playerEntity.getComponent<RenderModel>(ComponentType.RenderModel);
        if (transform) this.attemptAutoFire(time, transform, upgrades, renderModel);
    }
  }

  private triggerPurge() {
      this.purgeState = { active: true, shotsRemaining: 180, currentAngle: 0, accumulator: 0 };
      const player = this.getPlayerEntity();
      if (player) {
          const t = player.getComponent<TransformData>(ComponentType.Transform);
          if (t) {
              this.events.emit(GameEvents.SPAWN_FX, { type: 'PURGE_BLAST', x: t.x, y: t.y, angle: 0 });
              this.events.emit(GameEvents.TRAUMA_ADDED, { amount: 0.5 });
          }
      }
  }

  private triggerNova() {
      const player = this.getPlayerEntity();
      if (!player) return;
      const t = player.getComponent<TransformData>(ComponentType.Transform);
      if (!t) return;

      const bulletCount = 80; 
      const speed = 42.0;
      const damage = 999;

      for (let i = 0; i < bulletCount; i++) {
          const ratio = i / bulletCount;
          const angle = ratio * Math.PI * 2;
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;
          
          const b = this.spawner.spawnBullet(t.x, t.y, vx, vy, Faction.FRIENDLY, 2.0, damage, WeaponIDs.PLAYER_PURGE);
          const model = b.getComponent<RenderModel>(ComponentType.RenderModel);
          
          if (model) { 
              this.tempColor.setHSL(ratio, 0.9, 0.6);
              model.r = this.tempColor.r;
              model.g = this.tempColor.g;
              model.b = this.tempColor.b;
          }
      }
      this.events.emit(GameEvents.TRAUMA_ADDED, { amount: 0.8 });
  }

  private processPurgeFrame(delta: number, originX: number, originY: number) {
      const ANGLE_INCREMENT = 0.4; const SPEED = 24; const DAMAGE = 50;
      const LIFE = 2.4; const FIRE_RATE = 164; 
      this.purgeState.accumulator += delta * FIRE_RATE;
      while (this.purgeState.accumulator >= 1.0) {
          this.purgeState.accumulator -= 1.0;
          if (this.purgeState.shotsRemaining <= 0) { 
              this.purgeState.active = false; 
              this.events.emit(GameEvents.PURGE_COMPLETE, null); 
              break; 
          }
          const angle = this.purgeState.currentAngle;
          const vx = Math.cos(angle) * SPEED; const vy = Math.sin(angle) * SPEED;
          const bullet = this.spawner.spawnBullet(originX, originY, vx, vy, Faction.FRIENDLY, LIFE, DAMAGE, WeaponIDs.PLAYER_PURGE);
          const hue = (this.purgeState.currentAngle * 0.15) % 1.0; 
          this.tempColor.setHSL(hue, 1.0, 0.6); 
          const model = bullet.getComponent<RenderModel>(ComponentType.RenderModel);
          if (model) { model.r = this.tempColor.r; model.g = this.tempColor.g; model.b = this.tempColor.b; }
          if (this.purgeState.shotsRemaining % 5 === 0) { this.events.emit(GameEvents.PLAY_SOUND, { key: 'fx_player_fire', x: originX }); }
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
    this.events.emit(GameEvents.PLAY_SOUND, { key: 'fx_player_fire', x: pPos.x });
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

  teardown(): void { this.unsubPurge(); }
}
