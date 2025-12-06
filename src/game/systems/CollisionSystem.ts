import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { EntitySystem } from './EntitySystem';
import { Registry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { HealthComponent } from '../components/data/HealthComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { useGameStore } from '../store/useGameStore';
import { EnemyTypes } from '../config/Identifiers';

export class CollisionSystem implements IGameSystem {
  private entitySystem!: EntitySystem;
  private locator!: IServiceLocator;

  setup(locator: IServiceLocator): void {
    this.locator = locator;
    this.entitySystem = locator.getSystem<EntitySystem>('EntitySystem');
  }

  update(delta: number, time: number): void {
    const spatial = this.entitySystem.spatialGrid;
    const cursor = this.locator.getInputService().getCursor();

    // 1. PLAYER BULLETS vs ENEMIES
    this.handleBulletCollisions(spatial);

    // 2. ENEMY BULLETS vs PLAYER
    // (Existing logic: Cursor based)
    const bullets = Registry.getByTag(Tag.BULLET);
    for (const b of bullets) {
        if (!b.hasTag(Tag.ENEMY)) continue;
        const bPos = b.getComponent<TransformComponent>('Transform');
        if (!bPos) continue;
        const dx = bPos.x - cursor.x;
        const dy = bPos.y - cursor.y;
        if (dx*dx + dy*dy < 0.25) { // 0.5 radius squared
            Registry.destroyEntity(b.id);
            this.damagePlayer(10); // Bullet Damage
            this.entitySystem.spawnParticle(bPos.x, bPos.y, '#FF003C', 5);
        }
    }

    // 3. BODY COLLISIONS (Player vs Enemy)
    // We get the Player Entity (Component-based position)
    const players = Registry.getByTag(Tag.PLAYER);
    const player = players[0];
    
    if (player && player.active) {
        const pPos = player.getComponent<TransformComponent>('Transform');
        if (pPos) {
            // Broadphase around player
            const nearby = spatial.query(pPos.x, pPos.y, 1.0);
            
            for (const id of nearby) {
                const enemy = Registry.getEntity(id);
                if (!enemy || !enemy.active || !enemy.hasTag(Tag.ENEMY)) continue;
                
                // Exclude bullets here, handled above
                if (enemy.hasTag(Tag.BULLET)) continue; 

                const ePos = enemy.getComponent<TransformComponent>('Transform');
                if (!ePos) continue;

                // Collision Check
                const dx = pPos.x - ePos.x;
                const dy = pPos.y - ePos.y;
                const distSq = dx*dx + dy*dy;
                
                // Player Radius (0.1) + Enemy Radius (0.5) = 0.6 -> Sq = 0.36
                if (distSq < 0.36) {
                    this.handleBodyCollision(enemy, ePos.x, ePos.y);
                }
            }
        }
    }
  }

  private handleBodyCollision(enemy: any, x: number, y: number) {
      const identity = enemy.getComponent<IdentityComponent>('Identity');
      const type = identity ? identity.variant : 'unknown';
      
      // KAMIKAZE: High Damage, Big Shake
      if (type === EnemyTypes.KAMIKAZE) {
          this.damagePlayer(25); 
          this.entitySystem.spawnParticle(x, y, '#FF003C', 15);
      } 
      // OTHERS: Normal Damage, Low Shake
      else {
          this.damagePlayer(10);
          this.entitySystem.spawnParticle(x, y, '#9E4EA5', 8);
      }

      // DESTROY ENEMY (Explode body)
      // We destroy directly to bypass "Kill Count" score event in PlayerSystem
      Registry.destroyEntity(enemy.id);
  }

  private damagePlayer(amount: number) {
      const store = useGameStore.getState();
      if (store.playerHealth > 0) {
           GameEventBus.emit(GameEvents.PLAYER_HIT, { damage: amount });
      } else {
           store.damageRebootProgress(amount * 2); 
           GameEventBus.emit(GameEvents.PLAYER_HIT, { damage: 0 }); // Visual only
      }
  }

  private handleBulletCollisions(spatial: any) {
    const bullets = Registry.getByTag(Tag.BULLET);
    for (const b of bullets) {
        if (b.hasTag(Tag.ENEMY)) continue; 
        const bPos = b.getComponent<TransformComponent>('Transform');
        if (!bPos) continue;

        const candidates = spatial.query(bPos.x, bPos.y, 1.0);
        for (const targetId of candidates) {
            const target = Registry.getEntity(targetId);
            if (!target || !target.active || !target.hasTag(Tag.ENEMY) || target.hasTag(Tag.BULLET)) continue;

            const tPos = target.getComponent<TransformComponent>('Transform');
            if (!tPos) continue;

            const dx = bPos.x - tPos.x;
            const dy = bPos.y - tPos.y;
            if (dx*dx + dy*dy < 0.49) { // 0.7 squared
                Registry.destroyEntity(b.id);
                
                const hp = target.getComponent<HealthComponent>('Health');
                if (hp) {
                    hp.damage(1);
                    GameEventBus.emit(GameEvents.ENEMY_DAMAGED, { 
                        id: target.id as number, damage: 1, type: 'unknown' 
                    });
                }
                this.entitySystem.spawnParticle(bPos.x, bPos.y, '#FFF', 2);
                break;
            }
        }
    }
  }

  teardown(): void {}
}
