import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { EntitySystem } from './EntitySystem';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents, EnemyType } from '../events/GameEvents';
import { EnemyTypes } from '../config/Identifiers'; // Backward compatibility for Enum
import { useGameStore } from '../store/useGameStore';

export class CollisionSystem implements IGameSystem {
  private entitySystem!: EntitySystem;
  private locator!: IServiceLocator;

  // We no longer take deps in constructor
  setup(locator: IServiceLocator): void {
    this.locator = locator;
    // We fetch the specific system we need
    this.entitySystem = locator.getSystem<EntitySystem>('EntitySystem');
  }

  update(delta: number, time: number): void {
    const cursor = this.locator.getInputService().getCursor();
    
    this.checkPlayerBulletCollisions();
    this.checkEnemyBulletCollisions(cursor);
    this.checkProjectileClash();
  }

  teardown(): void {
    // No explicit cleanup needed
  }

  private checkPlayerBulletCollisions() {
    const bullets = this.entitySystem.bullets;
    const enemies = this.entitySystem.enemies;

    for (const b of bullets) {
      if (!b.active) continue;
      for (const e of enemies) {
        if (!e.active) continue;
        
        const dx = b.x - e.x;
        const dy = b.y - e.y;
        const distSq = dx*dx + dy*dy;
        const radiusSum = b.radius + e.radius;

        if (distSq < radiusSum * radiusSum) {
          e.hp--;
          b.active = false;
          GameEventBus.emit(GameEvents.ENEMY_DAMAGED, { id: e.id, damage: 1, type: e.type });

          if (e.hp <= 0) {
            e.active = false;
            const color = e.type === EnemyTypes.HUNTER ? '#F7D277' : e.type === EnemyTypes.KAMIKAZE ? '#FF003C' : '#9E4EA5';
            this.entitySystem.spawnParticle(e.x, e.y, color, 8);
            GameEventBus.emit(GameEvents.ENEMY_DESTROYED, { id: e.id, type: e.type, x: e.x, y: e.y });
          } else {
            this.entitySystem.spawnParticle(b.x, b.y, '#FFF', 2);
          }
          break;
        }
      }
    }
  }

  private checkEnemyBulletCollisions(cursor: {x: number, y: number}) {
    const bullets = this.entitySystem.enemyBullets;
    
    for (const eb of bullets) {
        if (!eb.active) continue;
        const dx = eb.x - cursor.x;
        const dy = eb.y - cursor.y;
        const distSq = dx*dx + dy*dy;
        
        if (distSq < (eb.radius + 0.5) ** 2) {
            eb.active = false;
            
            const store = useGameStore.getState();
            if (store.playerHealth > 0) {
                 GameEventBus.emit(GameEvents.PLAYER_HIT, { damage: 10 });
            } else {
                 store.damageRebootProgress(30); 
                 GameEventBus.emit(GameEvents.PLAYER_HIT, { damage: 0 }); 
            }
            
            this.entitySystem.spawnParticle(eb.x, eb.y, '#FF003C', 5);
        }
    }
  }

  private checkProjectileClash() {
    const pBullets = this.entitySystem.bullets;
    const eBullets = this.entitySystem.enemyBullets;

    for (const pb of pBullets) {
        if (!pb.active) continue;
        for (const eb of eBullets) {
            if (!eb.active) continue;
            
            const dx = pb.x - eb.x;
            const dy = pb.y - eb.y;
            const distSq = dx*dx + dy*dy;
            
            if (distSq < (pb.radius + eb.radius) ** 2) {
                pb.active = false; 
                eb.hp = (eb.hp || 1) - 1;
                
                if (eb.hp <= 0) {
                    eb.active = false;
                    GameEventBus.emit(GameEvents.PROJECTILE_CLASH, { x: eb.x, y: eb.y });
                    this.entitySystem.spawnParticle(eb.x, eb.y, '#F7D277', 6);
                } else {
                    this.entitySystem.spawnParticle(eb.x, eb.y, '#FFFFFF', 2);
                }
                break;
            }
        }
    }
  }
}
