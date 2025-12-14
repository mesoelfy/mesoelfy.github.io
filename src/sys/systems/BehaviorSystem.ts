import { IGameSystem, IServiceLocator, IEntitySpawner } from '@/engine/interfaces';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { IdentityData } from '@/sys/data/IdentityData';
import { PanelRegistry } from './PanelRegistrySystem';
import { EnemyTypes } from '@/sys/config/Identifiers';
import { GameEventBus } from '@/engine/signals/GameEventBus'; 
import { GameEvents, FXVariant } from '@/engine/signals/GameEvents'; 
import { useGameStore } from '@/sys/state/game/useGameStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { OrbitalData } from '@/sys/data/OrbitalData';
import { ConfigService } from '@/sys/services/ConfigService';
import { FastEventBus, FastEvents, FX_IDS } from '@/engine/signals/FastEventBus';
import { ViewportHelper } from '@/engine/math/ViewportHelper';

import { AIRegistry } from '@/sys/handlers/ai/AIRegistry';
import { AIContext } from '@/sys/handlers/ai/types';

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
        const orbital = e.getComponent<OrbitalData>('Orbital');
        if (orbital) {
            orbital.radius = 4.0;
            orbital.speed = 1.5 + Math.random() * 1.0; 
            orbital.angle = Math.random() * Math.PI * 2;
        }
    });
  }

  update(delta: number, time: number): void {
    const upgrades = useGameStore.getState().activeUpgrades;
    const halfWidth = ViewportHelper.viewport.width / 2;

    const aiContext: AIContext = {
      delta,
      time,
      spawnProjectile: (x, y, vx, vy, damage) => {
          if (damage) {
              const bullet = this.spawner.spawnBullet(x, y, vx, vy, false, 2.0, damage, 4.0);
              bullet.addComponent(new IdentityData('DAEMON_SHOT'));
          } else {
              this.spawner.spawnBullet(x, y, vx, vy, true, 3.0);
          }
      },
      spawnDrillSparks: (x, y, angle) => FastEventBus.emit(FastEvents.SPAWN_FX, FX_IDS['DRILL_SPARKS'], x, y, angle),
      spawnLaunchSparks: (x, y, angle) => FastEventBus.emit(FastEvents.SPAWN_FX, FX_IDS['HUNTER_RECOIL'], x, y, angle),
      
      spawnFX: (type, x, y) => {
          const id = FX_IDS[type];
          if (id) FastEventBus.emit(FastEvents.SPAWN_FX, id, x, y, 0);
      },
      
      damagePanel: (id, amount) => PanelRegistry.damagePanel(id, amount),
      
      // SPATIAL AUDIO
      playSound: (key, x) => {
          const pan = x !== undefined && halfWidth > 0 
            ? Math.max(-1, Math.min(1, x / halfWidth)) 
            : 0;
          AudioSystem.playSound(key, pan);
      },
      
      getUpgradeLevel: (key) => upgrades[key] || 0,
      config: this.config
    };

    const entities = this.registry.getAll();
    for (const entity of entities) {
        if (!entity.active) continue;
        const identity = entity.getComponent<IdentityData>('Identity');
        if (!identity) continue;

        const behavior = AIRegistry.get(identity.variant);
        if (behavior) {
            behavior.update(entity, aiContext);
        }
    }
  }

  teardown(): void {}
}
