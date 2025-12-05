import { ServiceLocator } from '../core/ServiceLocator';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../config/Identifiers';

export class PlayerSystem {
  private lastFireTime = 0;
  private fireRate = 0.15; 

  public update(time: number) {
    if (time > this.lastFireTime + this.fireRate) {
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
      const SPEED = 45;
      
      ServiceLocator.entitySystem.spawnBullet(
          cursor.x, 
          cursor.y, 
          (dx / dist) * SPEED, 
          (dy / dist) * SPEED, 
          false, 
          1.5, 
          0.2
      );
      
      GameEventBus.emit(GameEvents.PLAYER_FIRED, { x: cursor.x, y: cursor.y });
      this.lastFireTime = time;
    }
  }
}
