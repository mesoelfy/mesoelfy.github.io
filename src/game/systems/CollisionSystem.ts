import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { PhysicsSystem } from './PhysicsSystem';
import { EntityRegistry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { HealthComponent } from '../components/data/HealthComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { StateComponent } from '../components/data/StateComponent';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { EnemyTypes } from '../config/Identifiers';
import { GameStateSystem } from './GameStateSystem';
import { IEntitySpawner } from '../core/interfaces';

export class CollisionSystem implements IGameSystem {
  private physicsSystem!: PhysicsSystem;
  private gameSystem!: GameStateSystem;
  private registry!: EntityRegistry;
  private spawner!: IEntitySpawner;
  private locator!: IServiceLocator;

  setup(locator: IServiceLocator): void {
    this.locator = locator;
    this.physicsSystem = locator.getSystem<PhysicsSystem>('PhysicsSystem');
    this.gameSystem = locator.getSystem<GameStateSystem>('GameStateSystem');
    this.registry = locator.getRegistry() as EntityRegistry;
    this.spawner = locator.getSpawner();
  }

  update(delta: number, time: number): void {
    const spatial = this.physicsSystem.spatialGrid;
    const cursor = this.locator.getInputService().getCursor();

    this.handleBulletCollisions(spatial);
    this.handleProjectileClash(spatial);

    const bullets = this.registry.getByTag(Tag.BULLET);
    for (const b of bullets) {
        if (!b.hasTag(Tag.ENEMY)) continue;
        const bPos = b.getComponent<TransformComponent>('Transform');
        if (!bPos) continue;
        const dx = bPos.x - cursor.x;
        const dy = bPos.y - cursor.y;
        if (dx*dx + dy*dy < 0.25) { 
            this.registry.destroyEntity(b.id);
            this.damagePlayer(10); 
            this.spawner.spawnParticle(bPos.x, bPos.y, '#FF003C', 0, 0, 0.5);
        }
    }

    const players = this.registry.getByTag(Tag.PLAYER);
    const player = players[0];
    
    if (player && player.active) {
        const pPos = player.getComponent<TransformComponent>('Transform');
        if (pPos) {
            const nearby = spatial.query(pPos.x, pPos.y, 1.0);
            for (const id of nearby) {
                const enemy = this.registry.getEntity(id as any);
                
                // NEW: Ignore if spawning
                if (!enemy || !enemy.active || !enemy.hasTag(Tag.ENEMY)) continue;
                const state = enemy.getComponent<StateComponent>('State');
                if (state && state.current === 'SPAWN') continue;

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
      const playerBullets = this.registry.getByTag(Tag.BULLET).filter(b => !b.hasTag(Tag.ENEMY));
      for (const pb of playerBullets) {
          const pPos = pb.getComponent<TransformComponent>('Transform');
          if (!pPos) continue;
          const nearby = spatial.query(pPos.x, pPos.y, 1.0);
          for (const id of nearby) {
              const target = this.registry.getEntity(id as any);
              if (!target || !target.active || !target.hasTag(Tag.BULLET) || !target.hasTag(Tag.ENEMY)) continue;
              const tPos = target.getComponent<TransformComponent>('Transform');
              if (!tPos) continue;
              const dx = pPos.x - tPos.x;
              const dy = pPos.y - tPos.y;
              if (dx*dx + dy*dy < 1.0) {
                  this.registry.destroyEntity(pb.id);
                  this.registry.destroyEntity(target.id);
                  GameEventBus.emit(GameEvents.PROJECTILE_CLASH, { x: tPos.x, y: tPos.y });
                  this.spawner.spawnParticle(tPos.x, tPos.y, '#F7D277', 0, 0, 0.5);
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
          this.spawnExplosion(x, y, '#FF003C');
      } else {
          this.damagePlayer(10);
          this.spawnExplosion(x, y, '#9E4EA5');
      }
      this.registry.destroyEntity(enemy.id);
  }

  private spawnExplosion(x: number, y: number, color: string) {
      for(let i=0; i<8; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 15;
          this.spawner.spawnParticle(x, y, color, Math.cos(angle)*speed, Math.sin(angle)*speed, 0.8);
      }
  }

  private damagePlayer(amount: number) {
      this.gameSystem.damagePlayer(amount);
      GameEventBus.emit(GameEvents.PLAYER_HIT, { damage: amount });
  }

  private handleBulletCollisions(spatial: any) {
    const bullets = this.registry.getByTag(Tag.BULLET);
    for (const b of bullets) {
        if (b.hasTag(Tag.ENEMY)) continue; 
        const bPos = b.getComponent<TransformComponent>('Transform');
        if (!bPos) continue;

        const candidates = spatial.query(bPos.x, bPos.y, 1.0);
        for (const targetId of candidates) {
            const target = this.registry.getEntity(targetId as any);
            
            // NEW: Ignore if spawning
            if (!target || !target.active || !target.hasTag(Tag.ENEMY) || target.hasTag(Tag.BULLET)) continue;
            const state = target.getComponent<StateComponent>('State');
            if (state && state.current === 'SPAWN') continue;
            
            const dx = bPos.x - target.getComponent<TransformComponent>('Transform')!.x;
            const dy = bPos.y - target.getComponent<TransformComponent>('Transform')!.y;

            if (dx*dx + dy*dy < 0.49) { 
                this.registry.destroyEntity(b.id);
                const hp = target.getComponent<HealthComponent>('Health');
                if (hp) {
                    hp.damage(1);
                    GameEventBus.emit(GameEvents.ENEMY_DAMAGED, { 
                        id: target.id as number, damage: 1, type: 'unknown' 
                    });
                }
                this.spawner.spawnParticle(bPos.x, bPos.y, '#FFF', 0, 0, 0.2);
                break;
            }
        }
    }
  }

  teardown(): void {}
}
