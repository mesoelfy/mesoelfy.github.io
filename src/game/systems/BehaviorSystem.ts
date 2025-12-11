import { IGameSystem, IServiceLocator, IEntitySpawner } from '../core/interfaces';
import { EntityRegistry } from '../core/ecs/EntityRegistry';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { PanelRegistry } from './PanelRegistrySystem';
import { EnemyTypes } from '../config/Identifiers';
import { GameEventBus } from '../events/GameEventBus'; 
import { GameEvents, FXVariant } from '../events/GameEvents'; 
import { useGameStore } from '@/game/store/useGameStore';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { OrbitalComponent } from '../components/data/OrbitalComponent';
import { ConfigService } from '../services/ConfigService';

import { AIRegistry } from '../logic/ai/AIRegistry';
import { AIContext } from '../logic/ai/types';

export class BehaviorSystem implements IGameSystem {
  private registry!: EntityRegistry;
  private spawner!: IEntitySpawner;
  private config!: typeof ConfigService;

  setup(locator: IServiceLocator): void {
    this.registry = locator.getRegistry() as EntityRegistry;
    this.spawner = locator.getSpawner();
    this.config = locator.getConfigService();
    
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
    const upgrades = useGameStore.getState().activeUpgrades;

    const aiContext: AIContext = {
      delta,
      time,
      spawnProjectile: (x, y, vx, vy, damage) => {
          if (damage) {
              const bullet = this.spawner.spawnBullet(x, y, vx, vy, false, 2.0, damage, 4.0);
              bullet.addComponent(new IdentityComponent('DAEMON_SHOT'));
          } else {
              this.spawner.spawnBullet(x, y, vx, vy, true, 3.0);
          }
      },
      spawnDrillSparks: (x, y, angle) => GameEventBus.emit(GameEvents.SPAWN_FX, { type: 'DRILL_SPARKS', x, y, angle }),
      spawnLaunchSparks: (x, y, angle) => GameEventBus.emit(GameEvents.SPAWN_FX, { type: 'HUNTER_RECOIL', x, y, angle }),
      spawnFX: (type, x, y) => GameEventBus.emit(GameEvents.SPAWN_FX, { type: type as FXVariant, x, y }),
      
      damagePanel: (id, amount) => PanelRegistry.damagePanel(id, amount),
      playSound: (key) => AudioSystem.playSound(key),
      getUpgradeLevel: (key) => upgrades[key] || 0,
      
      // INJECTED CONFIG
      config: this.config
    };

    const entities = this.registry.getAll();
    for (const entity of entities) {
        if (!entity.active) continue;
        const identity = entity.getComponent<IdentityComponent>('Identity');
        if (!identity) continue;

        const behavior = AIRegistry.get(identity.variant);
        if (behavior) {
            behavior.update(entity, aiContext);
        }
    }
  }

  teardown(): void {}
}
