import { IGameSystem, IEntitySpawner, IGameStateSystem, IEntityRegistry, IGameEventService, IFastEventService } from '@/engine/interfaces';
import { Tag, Faction } from '@/engine/ecs/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { RenderModel } from '@/engine/ecs/components/RenderModel';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { GameEvents } from '@/engine/signals/GameEvents';
import { FastEventType, SoundCode, FXCode } from '@/engine/signals/FastEventBus';
import { ConfigService } from '@/engine/services/ConfigService';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { calculatePlayerShots } from '@/engine/handlers/weapons/WeaponLogic';
import { AI_STATE } from '@/engine/ai/AIStateTypes';

export class WeaponSystem implements IGameSystem {
  private lastFireTime = 0;
  private unsubPurge: () => void;

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
    if (this.gameSystem.isGameOver || this.gameSystem.playerHealth <= 0) return;

    let playerEntity = null;
    for (const p of this.registry.getByTag(Tag.PLAYER)) { playerEntity = p; break; }
    if (!playerEntity) return;

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
      let startX = 0, startY = 0;
      
      const player = Array.from(this.registry.getByTag(Tag.PLAYER))[0];
      if (player) {
          const t = player.getComponent<TransformData>(ComponentType.Transform);
          if (t) { startX = t.x; startY = t.y; }
      }

      const count = 360; 
      const speed = 45; 
      const damage = 100;
      
      this.fastEvents.emit(FastEventType.SPAWN_FX, FXCode.PURGE_BLAST, startX * 100, startY * 100, 0);
      this.fastEvents.emit(FastEventType.CAM_SHAKE, 100); 

      for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count;
          this.spawner.spawnBullet(startX, startY, Math.cos(angle) * speed, Math.sin(angle) * speed, Faction.FRIENDLY, 3.0, damage, 'PLAYER_PURGE');
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
            bullet.addComponent(new TargetData(null, 'ENEMY'));
        }
    });

    this.fastEvents.emit(FastEventType.PLAY_SOUND, SoundCode.FX_PLAYER_FIRE, pPos.x * 100);
    this.lastFireTime = time;
  }

  teardown(): void {
    this.unsubPurge();
  }
}
