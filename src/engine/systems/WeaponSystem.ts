import { IGameSystem, IEntitySpawner, IGameStateSystem, IEntityRegistry, IGameEventService, IFastEventService } from '@/engine/interfaces';
import { Tag } from '@/engine/ecs/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { RenderData } from '@/engine/ecs/components/RenderData';
import { GameEvents } from '@/engine/signals/GameEvents';
import { FastEvents, REVERSE_SOUND_MAP, REVERSE_FX_MAP } from '@/engine/signals/FastEventBus';
import { ConfigService } from '@/engine/services/ConfigService';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { calculatePlayerShots } from '@/engine/handlers/weapons/WeaponLogic';
import { AI_STATE } from '@/engine/ai/AIStateTypes';
import { TargetData } from '@/engine/ecs/components/TargetData';

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
        const render = playerEntity.getComponent<RenderData>(ComponentType.Render);
        if (transform) {
            this.attemptAutoFire(time, transform, upgrades, render);
        }
    }
  }

  private triggerPurge() {
      const player = Array.from(this.registry.getByTag(Tag.PLAYER))[0];
      if (!player) return;
      const t = player.getComponent<TransformData>(ComponentType.Transform);
      if (!t) return;

      const count = 360; const speed = 45; const damage = 100;
      
      // Fast FX: 2 = SPAWN_FX, 13 = PURGE_BLAST
      this.fastEvents.emit(FastEvents.SPAWN_FX, 13, t.x * 100, t.y * 100, 0);
      this.fastEvents.emit(FastEvents.CAM_SHAKE, 100); 

      for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count;
          this.spawner.spawnBullet(t.x, t.y, Math.cos(angle) * speed, Math.sin(angle) * speed, false, 2.0, damage, 'PLAYER_PURGE');
      }
  }

  private attemptAutoFire(time: number, pPos: TransformData, upgrades: Record<string, number>, pRender?: RenderData) {
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
        const bullet = this.spawner.spawnBullet(shot.x, shot.y, shot.vx, shot.vy, false, shot.life, shot.damage, shot.configId);
        if (pRender) {
            const bRender = bullet.getComponent<RenderData>(ComponentType.Render);
            if (bRender) { bRender.r = pRender.r * 4; bRender.g = pRender.g * 4; bRender.b = pRender.b * 4; }
        }
        if (shot.isHoming) bullet.addComponent(new TargetData(null, 'ENEMY'));
    });

    // Fast Sound: 1 = PLAY_SOUND, 1 = fx_player_fire
    this.fastEvents.emit(FastEvents.PLAY_SOUND, 1, pPos.x * 100);
    this.lastFireTime = time;
  }

  teardown(): void {
    this.unsubPurge();
  }
}
