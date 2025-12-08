import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { EntitySystem } from './EntitySystem';
import { Registry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { HealthComponent } from '../components/data/HealthComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { EnemyTypes } from '../config/Identifiers';
import { GameStateSystem } from './GameStateSystem';

export class CollisionSystem implements IGameSystem {
  private entitySystem!: EntitySystem;
  private gameSystem!: GameStateSystem;
  private locator!: IServiceLocator;

  setup(locator: IServiceLocator): void {
    this.locator = locator;
    this.entitySystem = locator.getSystem<EntitySystem>('EntitySystem');
    this.gameSystem = locator.getSystem<GameStateSystem>('GameStateSystem');
  }

  update(delta: number, time: number): void {
    const spatial = this.entitySystem.spatialGrid;
    const cursor = this.locator.getInputService().getCursor();

    this.handleBulletCollisions(spatial);
    this.handleProjectileClash(spatial);

    // Enemy Bullets vs Player
    const bullets = Registry.getByTag(Tag.BULLET);
    for (const b of bullets) {
        if (!b.hasTag(Tag.ENEMY)) continue;
        const bPos = b.getComponent<TransformComponent>('Transform');
        if (!bPos) continue;
        const dx = bPos.x - cursor.x;
        const dy = bPos.y - cursor.y;
        if (dx*dx + dy*dy < 0.25) { 
            Registry.destroyEntity(b.id);
            this.damagePlayer(10); 
            this.entitySystem.spawnParticle(bPos.x, bPos.y, '#FF003C', 5);
        }
    }

    // Body Collisions
    const players = Registry.getByTag(Tag.PLAYER);
    const player = players[0];
    
    if (player && player.active) {
        const pPos = player.getComponent<TransformComponent>('Transform');
        if (pPos) {
            const nearby = spatial.query(pPos.x, pPos.y, 1.0);
            for (const id of nearby) {
                const enemy = Registry.getEntity(id);
                if (!enemy || !enemy.active || !enemy.hasTag(Tag.ENEMY)) continue;
                if (enemy.hasTag(Tag.BULLET)) continue; 

                const ePos = enemy.getComponent<TransformComponent>('Transform');
                if (!ePos) continue;

                const dx = pPos.x - ePos.x;
                const dy = pPos.y - ePos.y;
                
                if (dx*dx + dy*dy < 0.36) {
                    this.handleBodyCollision(enemy, ePos.x, ePos.y);
                }
            }
        }
    }
  }

  private handleProjectileClash(spatial: any) {
      const playerBullets = Registry.getByTag(Tag.BULLET).filter(b => !b.hasTag(Tag.ENEMY));
      for (const pb of playerBullets) {
          const pPos = pb.getComponent<TransformComponent>('Transform');
          if (!pPos) continue;
          const nearby = spatial.query(pPos.x, pPos.y, 1.0);
          for (const id of nearby) {
              const target = Registry.getEntity(id);
              if (!target || !target.active || !target.hasTag(Tag.BULLET) || !target.hasTag(Tag.ENEMY)) continue;
              const tPos = target.getComponent<TransformComponent>('Transform');
              if (!tPos) continue;
              const dx = pPos.x - tPos.x;
              const dy = pPos.y - tPos.y;
              if (dx*dx + dy*dy < 1.0) {
                  Registry.destroyEntity(pb.id);
                  Registry.destroyEntity(target.id);
                  GameEventBus.emit(GameEvents.PROJECTILE_CLASH, { x: tPos.x, y: tPos.y });
                  this.entitySystem.spawnParticle(tPos.x, tPos.y, '#F7D277', 6);
                  break; 
              }
          }
      }
  }

  private handleBodyCollision(enemy: any, x: number, y: number) {
      const identity = enemy.getComponent<IdentityComponent>('Identity');
      const type = identity ? identity.variant : 'unknown';
      if (type === EnemyTypes.KAMIKAZE) {
          this.damagePlayer(25); 
          this.entitySystem.spawnParticle(x, y, '#FF003C', 15);
      } else {
          this.damagePlayer(10);
          this.entitySystem.spawnParticle(x, y, '#9E4EA5', 8);
      }
      Registry.destroyEntity(enemy.id);
  }

  private damagePlayer(amount: number) {
      this.gameSystem.damagePlayer(amount);
      GameEventBus.emit(GameEvents.PLAYER_HIT, { damage: amount });
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
            
            const dx = bPos.x - target.getComponent<TransformComponent>('Transform')!.x;
            const dy = bPos.y - target.getComponent<TransformComponent>('Transform')!.y;

            if (dx*dx + dy*dy < 0.49) { 
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
