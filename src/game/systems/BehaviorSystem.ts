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

  private readonly PURPLE_PALETTE = ['#9E4EA5', '#D0A3D8', '#E0B0FF', '#7A2F8F', '#B57EDC'];
  private readonly YELLOW_PALETTE = ['#F7D277', '#FFE5A0', '#FFA500', '#FFFFFF'];

  setup(locator: IServiceLocator): void {
    this.registry = locator.getRegistry() as EntityRegistry;
    this.spawner = locator.getSpawner();
  }

  update(delta: number, time: number): void {
    const aiContext: AIContext = {
      delta,
      time,
      spawnProjectile: (x, y, vx, vy) => this.spawner.spawnBullet(x, y, vx, vy, true, 3.0),
      spawnDrillSparks: (x, y, angle) => this.spawnDirectionalSparks(x, y, angle, this.PURPLE_PALETTE, 5, 8),
      // NEW: Hunter Launch Sparks (Yellow, faster, more explosive)
      spawnLaunchSparks: (x, y, angle) => this.spawnDirectionalSparks(x, y, angle, this.YELLOW_PALETTE, 12, 15),
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

  private spawnDirectionalSparks(x: number, y: number, angleFacing: number, palette: string[], count: number, speedBase: number) {
      // Eject backwards (Opposite to facing)
      // Hunter/Driller facing is aligned to wall/target. 
      // Facing = Angle. Backwards = Angle + PI (or -PI)
      // NOTE: Our rotation logic is usually Angle - PI/2 for "Up" facing models.
      // So if 'angleFacing' is the rotation value of the entity:
      // Entity points UP relative to rotation. Backwards is DOWN (-Y relative).
      // That is rotation - PI/2.
      
      const baseEject = angleFacing - (Math.PI / 2);

      for(let i=0; i<count; i++) {
          const color = palette[Math.floor(Math.random() * palette.length)];
          const spread = (Math.random() - 0.5) * 0.8; 
          const angle = baseEject + spread;
          const speed = speedBase + Math.random() * 5;
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;
          const life = 0.2 + Math.random() * 0.2;

          this.spawner.spawnParticle(x, y, color, vx, vy, life);
      }
  }

  teardown(): void {}
}
