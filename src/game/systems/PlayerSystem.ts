import { IGameSystem, IServiceLocator, IEntitySpawner, IGameStateSystem, IInteractionSystem } from '@/core/interfaces';
import { EntityRegistry } from '@/core/ecs/EntityRegistry';
import { GameEventBus } from '@/core/signals/GameEventBus';
import { GameEvents } from '@/core/signals/GameEvents';
import { Tag } from '@/core/ecs/types';
import { TransformData } from '@/game/data/TransformData';
import { AIStateData } from '@/game/data/AIStateData';
import { TargetData } from '@/game/data/TargetData';
import { ConfigService } from '@/game/services/ConfigService';
import { FastEventBus, FastEvents, FX_IDS } from '@/core/signals/FastEventBus';
import { ComponentType } from '@/core/ecs/ComponentType';
import { calculatePlayerShots, ShotDef } from '@/game/handlers/weapons/WeaponLogic';

export class PlayerSystem implements IGameSystem {
  private lastFireTime = 0;
  private gameSystem!: IGameStateSystem;
  private registry!: EntityRegistry;
  private spawner!: IEntitySpawner;
  private locator!: IServiceLocator;
  private config!: typeof ConfigService;

  setup(locator: IServiceLocator): void {
    this.locator = locator;
    this.gameSystem = locator.getSystem<IGameStateSystem>('GameStateSystem');
    this.registry = locator.getRegistry() as EntityRegistry;
    this.spawner = locator.getSpawner();
    this.config = locator.getConfigService();
    
    this.setupListeners();
  }

  update(delta: number, time: number): void {
    // 1. Get Player
    let playerEntity = null;
    for (const p of this.registry.getByTag(Tag.PLAYER)) {
        playerEntity = p;
        break;
    }
    if (!playerEntity) return;

    // 2. Input -> Transform Logic
    const transform = playerEntity.getComponent<TransformData>(ComponentType.Transform);
    const cursor = this.locator.getInputService().getCursor();

    if (transform) {
        transform.x = cursor.x;
        transform.y = cursor.y;
    }

    // 3. Game Over Check
    if (this.gameSystem.isGameOver || this.gameSystem.playerHealth <= 0) return;

    // 4. State Management
    const stateComp = playerEntity.getComponent<AIStateData>(ComponentType.State);
    if (stateComp) {
        try {
            const interact = this.locator.getSystem<IInteractionSystem>('InteractionSystem');
            stateComp.current = interact.repairState !== 'IDLE' ? 'REBOOTING' : 'ACTIVE';
        } catch {
            stateComp.current = 'ACTIVE';
        }
    }

    // 5. Firing Logic
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

  private setupListeners() {
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

  private attemptAutoFire(time: number, playerTransform: TransformData, upgrades: Record<string, number>) {
    // 1. Find Target
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

    // 2. Get Target Position
    const tPos = targetEnemy.getComponent<TransformData>(ComponentType.Transform)!;
    
    // 3. Delegate Calculation
    const shots = calculatePlayerShots(
        { x: playerTransform.x, y: playerTransform.y },
        { x: tPos.x, y: tPos.y },
        upgrades
    );

    // 4. Spawn
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
