import { IGameSystem, IServiceLocator, IEntitySpawner } from '../core/interfaces';
import { EntityRegistry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { PanelRegistry } from './PanelRegistrySystem';
import { EnemyTypes } from '../config/Identifiers';
import { GameEventBus } from '../events/GameEventBus'; 
import { GameEvents } from '../events/GameEvents'; 
import { useGameStore } from '@/game/store/useGameStore';

import { DrillerLogic } from '../logic/ai/DrillerLogic';
import { KamikazeLogic } from '../logic/ai/KamikazeLogic';
import { HunterLogic } from '../logic/ai/HunterLogic';
import { DaemonLogic } from '../logic/ai/DaemonLogic'; 
import { AIContext, EnemyLogic } from '../logic/ai/types';
import { OrbitalComponent } from '../components/data/OrbitalComponent';

export class BehaviorSystem implements IGameSystem {
  private registry!: EntityRegistry;
  private spawner!: IEntitySpawner;

  private behaviors: Record<string, EnemyLogic> = {
      [EnemyTypes.DRILLER]: DrillerLogic,
      [EnemyTypes.KAMIKAZE]: KamikazeLogic,
      [EnemyTypes.HUNTER]: HunterLogic,
      [EnemyTypes.DAEMON]: DaemonLogic 
  };

  private readonly PURPLE_PALETTE = ['#9E4EA5', '#D0A3D8', '#E0B0FF', '#7A2F8F', '#B57EDC'];
  private readonly YELLOW_PALETTE = ['#F7D277', '#FFE5A0', '#FFA500', '#FFFFFF'];

  setup(locator: IServiceLocator): void {
    this.registry = locator.getRegistry() as EntityRegistry;
    this.spawner = locator.getSpawner();
    
    GameEventBus.subscribe(GameEvents.SPAWN_DAEMON, () => {
        const e = this.spawner.spawnEnemy(EnemyTypes.DAEMON, 0, 0);
        
        const orbital = e.getComponent<OrbitalComponent>('Orbital');
        if (orbital) {
            orbital.radius = 4.0;
            orbital.speed = 1.5 + Math.random() * 1.0; 
            orbital.angle = Math.random() * Math.PI * 2;
        }
    });
  }

  update(delta: number, time: number): void {
    const aiContext: AIContext = {
      delta,
      time,
      spawnProjectile: (x, y, vx, vy) => {
          this.spawner.spawnBullet(x, y, vx, vy, true, 3.0);
      },
      spawnDrillSparks: (x, y, angle) => this.spawnDirectionalSparks(x, y, angle, this.PURPLE_PALETTE, 5, 8),
      spawnLaunchSparks: (x, y, angle) => this.spawnDirectionalSparks(x, y, angle, this.YELLOW_PALETTE, 12, 15),
      damagePanel: (id, amount) => PanelRegistry.damagePanel(id, amount)
    };

    // Dynamic Damage for Daemons
    const upgrades = useGameStore.getState().activeUpgrades;
    const executeLevel = upgrades['EXECUTE'] || 0;
    const daemonDamage = 10 + executeLevel;

    const daemonContext: AIContext = {
      ...aiContext,
      daemonMaxDamage: daemonDamage,
      spawnProjectile: (x, y, vx, vy) => {
          // Note: Logic will override this call to inject the specific shield HP damage
          const bullet = this.spawner.spawnBullet(x, y, vx, vy, false, 2.0, daemonDamage, 4.0);
          bullet.addComponent(new IdentityComponent('DAEMON_SHOT'));
          GameEventBus.emit(GameEvents.SPAWN_FX, { type: 'IMPACT_WHITE', x, y }); 
      }
    };

    const enemies = this.registry.getByTag(Tag.ENEMY);
    for (const entity of enemies) {
        if (!entity.active) continue;
        const identity = entity.getComponent<IdentityComponent>('Identity');
        if (identity && this.behaviors[identity.variant]) {
             this.behaviors[identity.variant].update(entity, aiContext);
        }
    }

    const daemons = this.registry.getAll(); 
    for (const entity of daemons) {
        if (!entity.active) continue;
        const identity = entity.getComponent<IdentityComponent>('Identity');
        if (identity && identity.variant === EnemyTypes.DAEMON) {
             this.behaviors[identity.variant].update(entity, daemonContext);
        }
    }
  }

  private spawnDirectionalSparks(x: number, y: number, facingAngle: number, palette: string[], count: number, speedBase: number) {
      const baseEject = facingAngle - (Math.PI / 2);
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
