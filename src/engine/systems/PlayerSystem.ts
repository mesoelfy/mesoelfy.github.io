import { IGameSystem, IEntitySpawner, IGameStateSystem, IInteractionSystem, IInputService, IEntityRegistry } from '@/engine/interfaces';
import { Tag } from '@/engine/ecs/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { RenderData } from '@/engine/ecs/components/RenderData';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { ConfigService } from '@/engine/services/ConfigService';
import { FastEventBus, FastEvents, FX_IDS } from '@/engine/signals/FastEventBus';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { calculatePlayerShots } from '@/engine/handlers/weapons/WeaponLogic';

export class PlayerSystem implements IGameSystem {
  private lastFireTime = 0;

  constructor(
    private input: IInputService,
    private spawner: IEntitySpawner,
    private gameSystem: IGameStateSystem,
    private interactionSystem: IInteractionSystem,
    private registry: IEntityRegistry,
    private config: typeof ConfigService
  ) {
    GameEventBus.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        if (p.option === 'PURGE') this.triggerPurge();
    });
  }

  update(delta: number, time: number): void {
    let playerEntity = null;
    for (const p of this.registry.getByTag(Tag.PLAYER)) { playerEntity = p; break; }
    if (!playerEntity) return;

    const transform = playerEntity.getComponent<TransformData>(ComponentType.Transform);
    const cursor = this.input.getCursor();
    if (transform) { transform.x = cursor.x; transform.y = cursor.y; }
    if (this.gameSystem.isGameOver || this.gameSystem.playerHealth <= 0) return;

    const stateComp = playerEntity.getComponent<AIStateData>(ComponentType.State);
    if (stateComp) stateComp.current = this.interactionSystem.repairState !== 'IDLE' ? 'REBOOTING' : 'ACTIVE';

    if (stateComp && (stateComp.current === 'ACTIVE' || stateComp.current === 'REBOOTING')) {
        const upgrades = this.gameSystem.activeUpgrades;
        const currentFireRate = this.config.player.fireRate / Math.pow(1.5, upgrades['OVERCLOCK'] || 0);
        if (time > this.lastFireTime + currentFireRate) {
            this.attemptAutoFire(time, transform!, upgrades, playerEntity.getComponent<RenderData>(ComponentType.Render));
        }
    }
  }

  private triggerPurge() {
      const cursor = this.input.getCursor();
      const count = 360; const speed = 45; const damage = 100;
      FastEventBus.emit(FastEvents.SPAWN_FX, FX_IDS['EXPLOSION_YELLOW'], cursor.x, cursor.y);
      FastEventBus.emit(FastEvents.TRAUMA, 1.0); 
      for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count;
          this.spawner.spawnBullet(cursor.x, cursor.y, Math.cos(angle) * speed, Math.sin(angle) * speed, false, 2.0, damage, 'PLAYER_PURGE');
      }
  }

  private attemptAutoFire(time: number, playerTransform: TransformData, upgrades: Record<string, number>, playerRender?: RenderData) {
    const enemies = this.registry.getByTag(Tag.ENEMY);
    let nearestDist = Infinity; let targetEnemy = null;
    for (const e of enemies) {
      if (!e.active || e.hasTag(Tag.BULLET)) continue;
      const state = e.getComponent<AIStateData>(ComponentType.State);
      if (state && state.current === 'SPAWN') continue;
      const t = e.getComponent<TransformData>(ComponentType.Transform);
      if (!t) continue;
      const dist = (t.x - playerTransform.x)**2 + (t.y - playerTransform.y)**2; 
      if (dist < 196 && dist < nearestDist) { nearestDist = dist; targetEnemy = e; }
    }
    if (!targetEnemy) return;

    const tPos = targetEnemy.getComponent<TransformData>(ComponentType.Transform)!;
    const shots = calculatePlayerShots({ x: playerTransform.x, y: playerTransform.y }, { x: tPos.x, y: tPos.y }, upgrades);

    shots.forEach(shot => {
        const bullet = this.spawner.spawnBullet(shot.x, shot.y, shot.vx, shot.vy, false, shot.life, shot.damage, shot.configId);
        if (playerRender) {
            const bRender = bullet.getComponent<RenderData>(ComponentType.Render);
            if (bRender) { bRender.r = playerRender.r * 4; bRender.g = playerRender.g * 4; bRender.b = playerRender.b * 4; }
        }
        if (shot.isHoming) bullet.addComponent(new TargetData(null, 'ENEMY'));
    });

    // MIGRATED: Fast Event
    FastEventBus.emit(FastEvents.PLAYER_FIRED, playerTransform.x, playerTransform.y);
    // Note: AudioDirector will pick this up via FX_PLAYER_FIRE mapping
    
    this.lastFireTime = time;
  }

  teardown(): void {}
}
