import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { EntityRegistry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { StateComponent } from '../components/data/StateComponent';
import { PanelRegistry } from './PanelRegistrySystem';
import { EnemyTypes } from '../config/Identifiers';
import { GameEventBus } from '../events/GameEventBus'; // NEW
import { GameEvents } from '../events/GameEvents'; // NEW

import { DrillerLogic } from '../logic/ai/DrillerLogic';
import { KamikazeLogic } from '../logic/ai/KamikazeLogic';
import { HunterLogic } from '../logic/ai/HunterLogic';
import { AIContext, EnemyLogic } from '../logic/ai/types';

export class BehaviorSystem implements IGameSystem {
  private registry!: EntityRegistry;
  // No spawner needed!

  private behaviors: Record<string, EnemyLogic> = {
      [EnemyTypes.DRILLER]: DrillerLogic,
      [EnemyTypes.KAMIKAZE]: KamikazeLogic,
      [EnemyTypes.HUNTER]: HunterLogic
  };

  setup(locator: IServiceLocator): void {
    this.registry = locator.getRegistry() as EntityRegistry;
  }

  update(delta: number, time: number): void {
    const aiContext: AIContext = {
      delta,
      time,
      // DELEGATE TO EVENT BUS
      spawnProjectile: (x, y, vx, vy) => {
          // Projectiles are gameplay, not FX, so we need a spawner or an event for this too?
          // Actually, Gameplay Projectiles should belong to a "ProjectileSystem" or kept here via Locator.
          // For now, let's grab spawner from locator dynamically to keep this file clean of the prop.
          // Or better: emit a 'SPAWN_PROJECTILE' event? 
          // Let's keep direct spawning for Gameplay objects (Bullets) but use Events for FX.
          // We need to re-grab spawner for Bullets.
          const spawner = require('../core/ServiceLocator').ServiceLocator.getSpawner();
          spawner.spawnBullet(x, y, vx, vy, true, 3.0);
      },
      spawnDrillSparks: (x, y, angle) => {
          GameEventBus.emit(GameEvents.SPAWN_FX, { type: 'DRILL_SPARKS', x, y, angle });
      },
      spawnLaunchSparks: (x, y, angle) => {
          GameEventBus.emit(GameEvents.SPAWN_FX, { type: 'HUNTER_RECOIL', x, y, angle });
      },
      damagePanel: (id, amount) => PanelRegistry.damagePanel(id, amount)
    };

    const enemies = this.registry.getByTag(Tag.ENEMY);
    
    for (const entity of enemies) {
        if (!entity.active) continue;
        
        const state = entity.getComponent<StateComponent>('State');
        if (state && state.current === 'SPAWN') {
            if (state.timers.spawn > 0) {
                state.timers.spawn -= delta;
                continue; 
            } else {
                state.current = 'IDLE'; 
            }
        }

        const identity = entity.getComponent<IdentityComponent>('Identity');
        if (identity && this.behaviors[identity.variant]) {
             this.behaviors[identity.variant].update(entity, aiContext);
        }
    }
  }

  teardown(): void {}
}
