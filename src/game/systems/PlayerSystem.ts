import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { EntitySystem } from './EntitySystem';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { PLAYER_CONFIG } from '../config/PlayerConfig';
import { ENEMY_CONFIG } from '../config/EnemyConfig';
import { useGameStore } from '../store/useGameStore';

// NEW: ECS Imports
import { Registry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';

export class PlayerSystem implements IGameSystem {
  private lastFireTime = 0;
  private entitySystem!: EntitySystem;
  private locator!: IServiceLocator;

  setup(locator: IServiceLocator): void {
    this.locator = locator;
    this.entitySystem = locator.getSystem<EntitySystem>('EntitySystem');
    this.setupListeners();
  }

  update(delta: number, time: number): void {
    const store = useGameStore.getState();
    if (!store.isPlaying) return;
    if (store.playerHealth <= 0) return;

    const upgrades = store.activeUpgrades;
    const rapidLevel = upgrades['RAPID_FIRE'] || 0;
    const currentFireRate = PLAYER_CONFIG.fireRate * Math.pow(0.85, rapidLevel);

    if (time > this.lastFireTime + currentFireRate) {
      this.attemptAutoFire(time);
    }
  }

  teardown(): void {
  }

  private setupListeners() {
    GameEventBus.subscribe(GameEvents.PLAYER_HIT, (payload) => {
      const { damage } = payload;
      const store = useGameStore.getState();
      store.damagePlayer(damage);
      if (store.playerHealth <= 0) this.handlePlayerDeath();
    });

    GameEventBus.subscribe(GameEvents.ENEMY_DESTROYED, (payload) => {
      const { type } = payload;
      const config = ENEMY_CONFIG[type];
      if (config) {
        useGameStore.getState().addScore(config.score);
        useGameStore.getState().addXp(config.score);
      }
    });
  }

  private handlePlayerDeath() {
    const store = useGameStore.getState();
    const identityPanel = store.panels['identity'];
    if (identityPanel && identityPanel.isDestroyed) {
        store.stopGame();
    }
  }

  private attemptAutoFire(time: number) {
    const cursor = this.locator.getInputService().getCursor();
    
    // FIX: Get enemies from ECS Registry instead of missing array
    const enemies = Registry.getByTag(Tag.ENEMY);

    let nearestDist = Infinity;
    const RANGE = 12; 
    let targetEnemy: any = null; // Entity

    for (const e of enemies) {
      if (!e.active) continue;
      
      // FIX: Get position from Component
      const transform = e.getComponent<TransformComponent>('Transform');
      if (!transform) continue;

      const dx = transform.x - cursor.x;
      const dy = transform.y - cursor.y;
      const dist = dx*dx + dy*dy; 

      if (dist < (RANGE * RANGE) && dist < nearestDist) {
          nearestDist = dist;
          targetEnemy = e;
      }
    }

    if (targetEnemy) {
      const tPos = targetEnemy.getComponent<TransformComponent>('Transform');
      if (!tPos) return;

      const dx = tPos.x - cursor.x;
      const dy = tPos.y - cursor.y;
      
      const upgrades = useGameStore.getState().activeUpgrades;
      const multiLevel = upgrades['MULTI_SHOT'] || 0;
      
      const projectileCount = 1 + (multiLevel * 2);
      const spreadAngle = 0.2; 
      const baseAngle = Math.atan2(dy, dx);
      const startAngle = baseAngle - ((projectileCount - 1) * spreadAngle) / 2;

      for (let i = 0; i < projectileCount; i++) {
          const angle = startAngle + (i * spreadAngle);
          const vx = Math.cos(angle) * PLAYER_CONFIG.bulletSpeed;
          const vy = Math.sin(angle) * PLAYER_CONFIG.bulletSpeed;

          this.entitySystem.spawnBullet(
              cursor.x, 
              cursor.y, 
              vx, 
              vy, 
              false, 
              PLAYER_CONFIG.bulletLife, 
              PLAYER_CONFIG.bulletRadius
          );
      }
      
      GameEventBus.emit(GameEvents.PLAYER_FIRED, { x: cursor.x, y: cursor.y });
      this.lastFireTime = time;
    }
  }
}
