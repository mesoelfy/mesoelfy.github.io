import { ServiceLocator } from '../core/ServiceLocator';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../config/Identifiers';
import { PLAYER_CONFIG } from '../config/PlayerConfig';
import { ENEMY_CONFIG } from '../config/EnemyConfig';
import { useGameStore } from '../store/useGameStore';

export class PlayerSystem {
  private lastFireTime = 0;

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    // 1. Damage
    GameEventBus.subscribe(GameEvents.PLAYER_HIT, (payload: any) => {
      const { damage } = payload;
      const store = useGameStore.getState();
      store.damagePlayer(damage);
      if (store.playerHealth <= 0) {
        this.handlePlayerDeath();
      }
    });

    // 2. Score & XP
    GameEventBus.subscribe(GameEvents.ENEMY_DESTROYED, (payload: any) => {
      const { type } = payload;
      const config = ENEMY_CONFIG[type];
      if (config) {
        // Atomic updates
        useGameStore.getState().addScore(config.score);
        useGameStore.getState().addXp(config.score); // Use score as XP basis for now
      }
    });
  }

  private handlePlayerDeath() {
    // Should trigger Safe Mode visually, but game continues for now
    // Only System Integrity hitting 0 ends the game completely.
  }

  public update(time: number) {
    if (!useGameStore.getState().isPlaying) return;
    
    // Disable shooting if dead (Safe Mode)
    if (useGameStore.getState().playerHealth <= 0) return;

    if (time > this.lastFireTime + PLAYER_CONFIG.fireRate) {
      this.attemptAutoFire(time);
    }
  }

  private attemptAutoFire(time: number) {
    const cursor = ServiceLocator.inputSystem.getCursorPosition();
    const enemies = ServiceLocator.entitySystem.enemies;

    let nearestDist = Infinity;
    const RANGE = 12; 
    let targetEnemy: any = null;

    for (const e of enemies) {
      if (!e.active) continue;
      const dx = e.x - cursor.x;
      const dy = e.y - cursor.y;
      const dist = dx*dx + dy*dy; 

      if (dist < (RANGE * RANGE)) {
        if (dist < nearestDist) {
          nearestDist = dist;
          targetEnemy = e;
        }
      }
    }

    if (targetEnemy) {
      const dx = targetEnemy.x - cursor.x;
      const dy = targetEnemy.y - cursor.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      ServiceLocator.entitySystem.spawnBullet(
          cursor.x, 
          cursor.y, 
          (dx / dist) * PLAYER_CONFIG.bulletSpeed, 
          (dy / dist) * PLAYER_CONFIG.bulletSpeed, 
          false, 
          PLAYER_CONFIG.bulletLife, 
          PLAYER_CONFIG.bulletRadius
      );
      
      GameEventBus.emit(GameEvents.PLAYER_FIRED, { x: cursor.x, y: cursor.y });
      this.lastFireTime = time;
    }
  }
}
