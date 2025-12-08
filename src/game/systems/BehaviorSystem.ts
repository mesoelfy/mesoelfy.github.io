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

  private readonly PURPLE_PALETTE = [
      '#9E4EA5', // Base
      '#D0A3D8', // Lavender
      '#E0B0FF', // Bright
      '#7A2F8F', // Dark
      '#B57EDC'  // Soft
  ];

  setup(locator: IServiceLocator): void {
    this.registry = locator.getRegistry() as EntityRegistry;
    this.spawner = locator.getSpawner();
  }

  update(delta: number, time: number): void {
    const aiContext: AIContext = {
      delta,
      time,
      spawnProjectile: (x, y, vx, vy) => this.spawner.spawnBullet(x, y, vx, vy, true, 3.0),
      spawnDrillSparks: (x, y, angle) => this.spawnDirectionalSparks(x, y, angle),
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

  private spawnDirectionalSparks(x: number, y: number, drillAngle: number) {
      // High Density for "Solid" stream
      const count = 5; 
      
      // FIX: Angle Correction
      // Cone points UP (+Y) in local space.
      // We want particles to fly DOWN (-Y).
      // Local -Y is -PI/2 relative to rotation.
      const baseEjectAngle = drillAngle - (Math.PI / 2);

      for(let i=0; i<count; i++) {
          const color = this.PURPLE_PALETTE[Math.floor(Math.random() * this.PURPLE_PALETTE.length)];
          
          // Spread: Narrow cone (approx 30 degrees total)
          const spread = (Math.random() - 0.5) * 0.5; 
          const angle = baseEjectAngle + spread;
          
          // Speed: High variance for "Spray" look
          const speed = 6 + Math.random() * 8;
          
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;

          // Lifetime: Very fast decay for "Fizz" effect
          const life = 0.1 + Math.random() * 0.15;

          this.spawner.spawnParticle(x, y, color, vx, vy, life);
      }
  }

  teardown(): void {}
}
