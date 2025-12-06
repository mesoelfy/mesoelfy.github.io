import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { EntitySystem } from './EntitySystem';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { PLAYER_CONFIG } from '../config/PlayerConfig';
import { useGameStore } from '../store/useGameStore';

import { Registry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { StateComponent } from '../components/data/StateComponent';
import { InteractionSystem } from './InteractionSystem';

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

    // 1. GET PLAYER ENTITY
    const players = Registry.getByTag(Tag.PLAYER);
    const playerEntity = players[0]; 
    if (!playerEntity) return;

    // 2. SYNC POSITION (CRITICAL FIX)
    // Move the physics entity to match the mouse cursor
    const cursor = this.locator.getInputService().getCursor();
    const transform = playerEntity.getComponent<TransformComponent>('Transform');
    if (transform) {
        transform.x = cursor.x;
        transform.y = cursor.y;
    }

    // 3. UPDATE STATE
    const stateComp = playerEntity.getComponent<StateComponent>('State');
    if (stateComp) {
        if (store.playerHealth <= 0) {
            stateComp.current = 'DEAD';
        } else {
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
    }

    // 4. COMBAT LOGIC
    if (stateComp && (stateComp.current === 'ACTIVE' || stateComp.current === 'REBOOTING')) {
        const upgrades = store.activeUpgrades;
        const rapidLevel = upgrades['RAPID_FIRE'] || 0;
        const currentFireRate = PLAYER_CONFIG.fireRate * Math.pow(0.85, rapidLevel);

        if (time > this.lastFireTime + currentFireRate) {
            this.attemptAutoFire(time, playerEntity);
        }
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

    GameEventBus.subscribe(GameEvents.ENEMY_DESTROYED, () => {
      useGameStore.getState().incrementKills(1);
      useGameStore.getState().addXp(10); 
    });
  }

  private handlePlayerDeath() {
    const store = useGameStore.getState();
    const identityPanel = store.panels['identity'];
    if (identityPanel && identityPanel.isDestroyed) {
        store.stopGame();
    }
  }

  private attemptAutoFire(time: number, player: any) {
    const cursor = this.locator.getInputService().getCursor();
    const enemies = Registry.getByTag(Tag.ENEMY);

    let nearestDist = Infinity;
    const RANGE = 12; 
    let targetEnemy: any = null;

    for (const e of enemies) {
      if (!e.active) continue;
      
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
