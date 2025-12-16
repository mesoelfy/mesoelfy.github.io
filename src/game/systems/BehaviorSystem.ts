import { IGameSystem, IServiceLocator, IEntitySpawner, IPanelSystem, IParticleSystem } from '@/core/interfaces';
import { EntityRegistry } from '@/core/ecs/EntityRegistry';
import { IdentityData } from '@/game/data/IdentityData';
import { ProjectileData } from '@/game/data/ProjectileData';
import { EnemyTypes } from '@/game/config/Identifiers';
import { GameEventBus } from '@/core/signals/GameEventBus'; 
import { GameEvents } from '@/core/signals/GameEvents'; 
import { useGameStore } from '@/game/state/game/useGameStore';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { OrbitalData } from '@/game/data/OrbitalData';
import { ConfigService } from '@/game/services/ConfigService';
import { FastEventBus, FastEvents, FX_IDS } from '@/core/signals/FastEventBus';
import { ViewportHelper } from '@/core/math/ViewportHelper';
import { AIRegistry } from '@/game/handlers/ai/AIRegistry';
import { AIContext } from '@/game/handlers/ai/types';
import { ComponentType } from '@/core/ecs/ComponentType';

export class BehaviorSystem implements IGameSystem {
  private registry!: EntityRegistry;
  private spawner!: IEntitySpawner;
  private config!: typeof ConfigService;
  private panelSystem!: IPanelSystem;
  private particleSystem!: IParticleSystem;

  setup(locator: IServiceLocator): void {
    this.registry = locator.getRegistry() as EntityRegistry;
    this.spawner = locator.getSpawner();
    this.config = locator.getConfigService();
    this.panelSystem = locator.getSystem<IPanelSystem>('PanelRegistrySystem');
    this.particleSystem = locator.getParticleSystem();
    
    GameEventBus.subscribe(GameEvents.SPAWN_DAEMON, () => {
        const e = this.spawner.spawnEnemy(EnemyTypes.DAEMON, 0, 0);
        const orbital = e.getComponent<OrbitalData>(ComponentType.Orbital);
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
      spawnProjectile: (x, y, vx, vy, damage, configId, ownerId) => {
          let bullet;
          if (damage) {
              const finalConfig = configId || 'DAEMON_ORB';
              bullet = this.spawner.spawnBullet(x, y, vx, vy, false, 2.0, damage, finalConfig);
              bullet.addComponent(new IdentityData('DAEMON_SHOT'));
          } else {
              const finalConfig = configId || 'ENEMY_HUNTER';
              bullet = this.spawner.spawnBullet(x, y, vx, vy, true, 3.0, 10, finalConfig);
          }

          if (ownerId !== undefined) {
              const proj = bullet.getComponent<ProjectileData>(ComponentType.Projectile);
              if (proj) proj.ownerId = ownerId;
          }

          return bullet;
      },
      spawnDrillSparks: (x, y, angle) => FastEventBus.emit(FastEvents.SPAWN_FX, FX_IDS['DRILL_SPARKS'], x, y, angle),
      spawnLaunchSparks: (x, y, angle) => FastEventBus.emit(FastEvents.SPAWN_FX, FX_IDS['HUNTER_RECOIL'], x, y, angle),
      spawnFX: (type, x, y) => {
          const id = FX_IDS[type];
          if (id) FastEventBus.emit(FastEvents.SPAWN_FX, id, x, y, 0);
      },
      // FIXED: Route to ParticleSystem directly for rendering
      spawnParticle: (x, y, color, vx, vy, life, size) => {
          // Shape 1 is teardrop/trail appropriate for exhaust
          this.particleSystem.spawn(x, y, color, vx, vy, life, size, 1);
      },
      damagePanel: (id, amount) => this.panelSystem.damagePanel(id, amount),
      getPanelRect: (id) => this.panelSystem.getPanelRect(id),
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
        const identity = entity.getComponent<IdentityData>(ComponentType.Identity);
        if (!identity) continue;

        const behavior = AIRegistry.get(identity.variant);
        if (behavior) {
            behavior.update(entity, aiContext);
        }
    }
  }

  teardown(): void {}
}
