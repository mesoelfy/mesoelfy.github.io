import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { EntitySystem } from './EntitySystem';
import { Registry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { HealthComponent } from '../components/data/HealthComponent';
import { CombatComponent } from '../components/data/CombatComponent';

import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { useGameStore } from '../store/useGameStore';

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
    const bullets = Registry.getByTag(Tag.BULLET);
    
    for (const b of bullets) {
        // Only Player bullets
        if (b.hasTag(Tag.ENEMY)) continue; 

        const bPos = b.getComponent<TransformComponent>('Transform');
        if (!bPos) continue;

        // Broad Phase
        const candidates = spatial.query(bPos.x, bPos.y, 1.0);
        
        for (const targetId of candidates) {
            const target = Registry.getEntity(targetId);
            if (!target || !target.active || !target.hasTag(Tag.ENEMY)) continue;

            const tPos = target.getComponent<TransformComponent>('Transform');
            if (!tPos) continue;

            // Narrow Phase (Circle vs Circle)
            // Hardcoded radii for now: Bullet=0.2, Enemy=0.5
            const dx = bPos.x - tPos.x;
            const dy = bPos.y - tPos.y;
            const distSq = dx*dx + dy*dy;
            
            if (distSq < (0.2 + 0.5) ** 2) {
                // HIT!
                Registry.destroyEntity(b.id); // Bullet dies
                
                const hp = target.getComponent<HealthComponent>('Health');
                if (hp) {
                    hp.damage(1);
                    GameEventBus.emit(GameEvents.ENEMY_DAMAGED, { 
                        id: target.id as number, 
                        damage: 1, 
                        type: 'unknown' 
                    });
                }
                
                this.entitySystem.spawnParticle(bPos.x, bPos.y, '#FFF', 2);
                break; // Bullet hit one thing, stop checking
            }
        }
    }

    // 2. ENEMY BULLETS vs PLAYER (Cursor)
    // Note: In Phase 3, Player will be an Entity. For now, it's the Cursor/Avatar.
    for (const b of bullets) {
        if (!b.hasTag(Tag.ENEMY)) continue;

        const bPos = b.getComponent<TransformComponent>('Transform');
        if (!bPos) continue;

        const dx = bPos.x - cursor.x;
        const dy = bPos.y - cursor.y;
        const distSq = dx*dx + dy*dy;
        
        // Player radius ~0.3
        if (distSq < (0.2 + 0.3) ** 2) {
            Registry.destroyEntity(b.id);
            
            const store = useGameStore.getState();
            if (store.playerHealth > 0) {
                 GameEventBus.emit(GameEvents.PLAYER_HIT, { damage: 10 });
            } else {
                 store.damageRebootProgress(30); 
                 GameEventBus.emit(GameEvents.PLAYER_HIT, { damage: 0 }); 
            }
            this.entitySystem.spawnParticle(bPos.x, bPos.y, '#FF003C', 5);
        }
    }
  }

  teardown(): void {}
}
