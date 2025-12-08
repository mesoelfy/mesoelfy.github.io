import { IGameSystem, IServiceLocator, IEntitySpawner } from '../core/interfaces';
import { EntityRegistry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { StateComponent } from '../components/data/StateComponent';
import { PanelRegistry } from './PanelRegistrySystem';
import { EnemyTypes } from '../config/Identifiers';

import { DrillerLogic } from '../logic/ai/DrillerLogic';
import { KamikazeLogic } from '../logic/ai/KamikazeLogic';
import { HunterLogic } from '../logic/ai/HunterLogic';
import { AIContext, EnemyLogic } from '../logic/ai/types';

export class BehaviorSystem implements IGameSystem {
  private registry!: EntityRegistry;
  private spawner!: IEntitySpawner;

  private behaviors: Record<string, EnemyLogic> = {
      [EnemyTypes.DRILLER]: DrillerLogic,
      [EnemyTypes.KAMIKAZE]: KamikazeLogic,
      [EnemyTypes.HUNTER]: HunterLogic
  };

  setup(locator: IServiceLocator): void {
    this.registry = locator.getRegistry() as EntityRegistry;
    this.spawner = locator.getSpawner();
  }

  update(delta: number, time: number): void {
    const aiContext: AIContext = {
      delta,
      time,
      spawnProjectile: (x, y, vx, vy) => this.spawner.spawnBullet(x, y, vx, vy, true, 3.0),
      spawnDrillSparks: (x, y, baseColor) => this.spawnSparks(x, y),
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

  // UPDATED: Mixed colors for sparks
  private spawnSparks(x: number, y: number) {
      const colors = ['#9E4EA5', '#D0A3D8', '#E0B0FF', '#FFFFFF']; // Dark, Light, Pale, White
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      // Slightly shorter life for "grinding" feel
      this.spawner.spawnParticle(x, y, color, Math.cos(angle)*speed, Math.sin(angle)*speed, 0.2);
  }

  teardown(): void {}
}
