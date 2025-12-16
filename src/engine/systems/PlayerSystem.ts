import { IGameSystem, IEntitySpawner, IGameStateSystem, IInteractionSystem, IInputService, IEntityRegistry } from '@/engine/interfaces';
import { Tag } from '@/engine/ecs/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { TargetData } from '@/engine/ecs/components/TargetData';
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
        if (p.option === 'PURGE') {
            this.triggerPurge();
        }
    });
  }

  update(delta: number, time: number): void {
    let playerEntity = null;
    for (const p of this.registry.getByTag(Tag.PLAYER)) {
        playerEntity = p;
        break;
    }
    if (!playerEntity) return;

    const transform = playerEntity.getComponent<TransformData>(ComponentType.Transform);
    const cursor = this.input.getCursor();

    if (transform) {
        transform.x = cursor.x;
        transform.y = cursor.y;
    }

    if (this.gameSystem.isGameOver || this.gameSystem.playerHealth <= 0) return;

    const stateComp = playerEntity.getComponent<AIStateData>(ComponentType.State);
    if (stateComp) {
        stateComp.current = this.interactionSystem.repairState !== 'IDLE' ? 'REBOOTING' : 'ACTIVE';
    }

    if (stateComp && (stateComp.current === 'ACTIVE' || stateComp.current === 'REBOOTING')) {
        const upgrades = this.gameSystem.activeUpgrades;
        const overclock = upgrades['OVERCLOCK'] || 0;
        const currentFireRate = this.config.player.fireRate / Math.pow(1.5, overclock);

        if (time > this.lastFireTime + currentFireRate) {
            this.attemptAutoFire(time, transform, upgrades);
        }
    }
  }

  teardown(): void {}

  private triggerPurge() {
      const cursor = this.input.getCursor();
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

  private attemptAutoFire(time: number, playerTransform: TransformData, upgrades: Record<string, number>) {
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
      const dx = t.x - playerTransform.x;
      const dy = t.y - playerTransform.y;
      const dist = dx*dx + dy*dy; 
      if (dist < (RANGE * RANGE) && dist < nearestDist) {
          nearestDist = dist;
          targetEnemy = e;
      }
    }

    if (!targetEnemy) return;

    const tPos = targetEnemy.getComponent<TransformData>(ComponentType.Transform)!;
    
    const shots = calculatePlayerShots(
        { x: playerTransform.x, y: playerTransform.y },
        { x: tPos.x, y: tPos.y },
        upgrades
    );

    shots.forEach(shot => {
        const bullet = this.spawner.spawnBullet(
            shot.x, shot.y, 
            shot.vx, shot.vy, 
            false, 
            shot.life, 
            shot.damage, 
            shot.configId
        );

        if (shot.isHoming) {
            bullet.addComponent(new TargetData(null, 'ENEMY'));
        }
    });

    FastEventBus.emit(FastEvents.PLAY_SOUND, FX_IDS['FX_PLAYER_FIRE'], playerTransform.x);
    this.lastFireTime = time;
  }
}
