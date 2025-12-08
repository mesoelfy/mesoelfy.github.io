import { IGameSystem, IServiceLocator, IEntitySpawner } from '../core/interfaces';
import { EntityRegistry } from '../core/ecs/EntityRegistry';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { PLAYER_CONFIG } from '../config/PlayerConfig';
import { Tag } from '../core/ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { StateComponent } from '../components/data/StateComponent';
import { TargetComponent } from '../components/data/TargetComponent';
import { InteractionSystem } from './InteractionSystem';
import { GameStateSystem } from './GameStateSystem';

export class PlayerSystem implements IGameSystem {
  private lastFireTime = 0;
  private gameSystem!: GameStateSystem;
  private registry!: EntityRegistry;
  private spawner!: IEntitySpawner;
  private locator!: IServiceLocator;

  setup(locator: IServiceLocator): void {
    this.locator = locator;
    this.gameSystem = locator.getSystem<GameStateSystem>('GameStateSystem');
    this.registry = locator.getRegistry() as EntityRegistry;
    this.spawner = locator.getSpawner();
    this.setupListeners();
  }

  update(delta: number, time: number): void {
    if (this.gameSystem.isGameOver || this.gameSystem.playerHealth <= 0) return;

    const players = this.registry.getByTag(Tag.PLAYER);
    const playerEntity = players[0]; 
    if (!playerEntity) return;

    const cursor = this.locator.getInputService().getCursor();
    const transform = playerEntity.getComponent<TransformComponent>('Transform');
    if (transform) {
        transform.x = cursor.x;
        transform.y = cursor.y;
    }

    const stateComp = playerEntity.getComponent<StateComponent>('State');
    if (stateComp) {
        try {
            const interact = this.locator.getSystem<InteractionSystem>('InteractionSystem');
            if (interact && interact.repairState !== 'IDLE') {
                stateComp.current = 'REBOOTING';
            } else {
                stateComp.current = 'ACTIVE';
            }
        } catch {
            stateComp.current = 'ACTIVE';
        }
    }

    if (stateComp && (stateComp.current === 'ACTIVE' || stateComp.current === 'REBOOTING')) {
        const upgrades = this.gameSystem.activeUpgrades;
        const overclock = upgrades['OVERCLOCK'] || 0;
        const currentFireRate = PLAYER_CONFIG.fireRate / Math.pow(1.5, overclock);

        if (time > this.lastFireTime + currentFireRate) {
            this.attemptAutoFire(time, playerEntity, upgrades);
        }
    }
  }

  teardown(): void {}

  private setupListeners() {
    GameEventBus.subscribe(GameEvents.ENEMY_DESTROYED, (payload) => {
      this.gameSystem.addScore(1);
      this.gameSystem.addXp(10);
    });
  }

  private attemptAutoFire(time: number, player: any, upgrades: Record<string, number>) {
    const cursor = this.locator.getInputService().getCursor();
    const enemies = this.registry.getByTag(Tag.ENEMY);
    let nearestDist = Infinity;
    const RANGE = 14; 
    let targetEnemy: any = null;

    for (const e of enemies) {
      if (!e.active) continue;
      const state = e.getComponent<StateComponent>('State');
      if (state && state.current === 'SPAWN') continue;

      const t = e.getComponent<TransformComponent>('Transform');
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
      // --- SHARED STATS ---
      const damage = 1 + (upgrades['EXECUTE'] || 0); // Renamed from ROOT
      const width = 1.0 + ((upgrades['BANDWIDTH'] || 0) * 0.5);

      const tPos = targetEnemy.getComponent<TransformComponent>('Transform')!;
      const dx = tPos.x - cursor.x;
      const dy = tPos.y - cursor.y;
      const baseAngle = Math.atan2(dy, dx);

      // ------------------------------------
      // 1. MAIN GUN (FORK)
      // ------------------------------------
      const forkLevel = upgrades['FORK'] || 0;
      const mainCount = 1 + (forkLevel * 2);
      const baseSpread = 0.15;
      const spreadAngle = baseSpread * width; 
      const startAngle = baseAngle - ((mainCount - 1) * spreadAngle) / 2;

      for (let i = 0; i < mainCount; i++) {
          const angle = startAngle + (i * spreadAngle);
          const vx = Math.cos(angle) * PLAYER_CONFIG.bulletSpeed;
          const vy = Math.sin(angle) * PLAYER_CONFIG.bulletSpeed;

          this.spawner.spawnBullet(
              cursor.x, cursor.y, vx, vy, false, 
              PLAYER_CONFIG.bulletLife, 
              damage, 
              width
          );
      }

      // ------------------------------------
      // 2. REAR GUN (BACKDOOR)
      // ------------------------------------
      const backdoorLevel = upgrades['BACKDOOR'] || 0;
      if (backdoorLevel > 0) {
          const rearAngle = baseAngle + Math.PI; 
          const vx = Math.cos(rearAngle) * PLAYER_CONFIG.bulletSpeed;
          const vy = Math.sin(rearAngle) * PLAYER_CONFIG.bulletSpeed;

          this.spawner.spawnBullet(
              cursor.x, cursor.y, vx, vy, false, 
              PLAYER_CONFIG.bulletLife, 
              damage, 
              width
          );
      }

      // ------------------------------------
      // 3. SNIFFER (HOMING MISSILES)
      // ------------------------------------
      const snifferLevel = upgrades['SNIFFER'] || 0;
      if (snifferLevel > 0) {
          // Radial Distribution: equal distance from each other
          const angleStep = (Math.PI * 2) / snifferLevel;
          // Offset start angle so if count=1 it goes forward, if count=2 it goes sides?
          // Let's align first shot with baseAngle.
          
          for(let i=0; i<snifferLevel; i++) {
              const angle = baseAngle + (i * angleStep);
              const vx = Math.cos(angle) * PLAYER_CONFIG.bulletSpeed;
              const vy = Math.sin(angle) * PLAYER_CONFIG.bulletSpeed;

              const bullet = this.spawner.spawnBullet(
                  cursor.x, cursor.y, vx, vy, false, 
                  PLAYER_CONFIG.bulletLife, 
                  damage, 
                  width
              );
              
              // Only Sniffer Bullets get Guidance
              bullet.addComponent(new TargetComponent(null, 'ENEMY'));
          }
      }
      
      GameEventBus.emit(GameEvents.PLAYER_FIRED, { x: cursor.x, y: cursor.y });
      this.lastFireTime = time;
    }
  }
}
