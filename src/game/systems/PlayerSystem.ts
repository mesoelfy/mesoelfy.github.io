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
        useGameStore.getState().addScore(config.score);
        useGameStore.getState().addXp(config.score);
      }
    });
  }

  private handlePlayerDeath() {
    useGameStore.getState().stopGame();
  }

  public update(time: number) {
    if (!useGameStore.getState().isPlaying) return;
    if (useGameStore.getState().playerHealth <= 0) return;

    // --- UPGRADE LOGIC: FIRE RATE ---
    const upgrades = useGameStore.getState().activeUpgrades;
    const rapidLevel = upgrades['RAPID_FIRE'] || 0;
    
    // Decrease delay by 15% per level
    const currentFireRate = PLAYER_CONFIG.fireRate * Math.pow(0.85, rapidLevel);

    if (time > this.lastFireTime + currentFireRate) {
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
      
      const upgrades = useGameStore.getState().activeUpgrades;
      const multiLevel = upgrades['MULTI_SHOT'] || 0;
      
      // --- UPGRADE LOGIC: PROJECTILES ---
      // Base: 1 shot. Level 1: 3 shots. Level 2: 5 shots.
      const projectileCount = 1 + (multiLevel * 2);
      const spreadAngle = 0.2; // roughly 11 degrees

      // Calculate base angle
      const baseAngle = Math.atan2(dy, dx);
      
      // Calculate start angle to center the spread
      const startAngle = baseAngle - ((projectileCount - 1) * spreadAngle) / 2;

      for (let i = 0; i < projectileCount; i++) {
          const angle = startAngle + (i * spreadAngle);
          const vx = Math.cos(angle) * PLAYER_CONFIG.bulletSpeed;
          const vy = Math.sin(angle) * PLAYER_CONFIG.bulletSpeed;

          ServiceLocator.entitySystem.spawnBullet(
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
