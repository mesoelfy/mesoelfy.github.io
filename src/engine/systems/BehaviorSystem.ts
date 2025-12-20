import { IGameSystem, IEntitySpawner, IPanelSystem, IParticleSystem, IEntityRegistry, IAudioService, IGameEventService, IFastEventService } from '@/engine/interfaces';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { ProjectileData } from '@/engine/ecs/components/ProjectileData';
import { OrbitalData } from '@/engine/ecs/components/OrbitalData';
import { EnemyTypes } from '@/engine/config/Identifiers';
import { GameEvents } from '@/engine/signals/GameEvents'; 
import { FastEvents, REVERSE_FX_MAP, REVERSE_SOUND_MAP } from '@/engine/signals/FastEventBus';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { ConfigService } from '@/engine/services/ConfigService';
import { ViewportHelper } from '@/engine/math/ViewportHelper';
import { AIRegistry } from '@/engine/handlers/ai/AIRegistry';
import { AIContext } from '@/engine/handlers/ai/types';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class BehaviorSystem implements IGameSystem {
  constructor(
    private registry: IEntityRegistry,
    private spawner: IEntitySpawner,
    private config: typeof ConfigService,
    private panelSystem: IPanelSystem,
    private particleSystem: IParticleSystem,
    private audio: IAudioService,
    private events: IGameEventService,
    private fastEvents: IFastEventService
  ) {
    events.subscribe(GameEvents.SPAWN_DAEMON, () => {
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
              bullet = this.spawner.spawnBullet(x, y, vx, vy, true, 3.0, 4, finalConfig);
          }
          if (ownerId !== undefined) {
              const proj = bullet.getComponent<ProjectileData>(ComponentType.Projectile);
              if (proj) proj.ownerId = ownerId;
          }
          return bullet;
      },
      spawnFX: (type, x, y, angle) => {
          const id = REVERSE_FX_MAP[type];
          if (id) this.fastEvents.emit(FastEvents.SPAWN_FX, id, x * 100, y * 100, (angle || 0) * 100);
      },
      spawnParticle: (x, y, color, vx, vy, life, size) => {
          this.particleSystem.spawn(x, y, color, vx, vy, life, size, 1);
      },
      damagePanel: (id, amount, sx, sy) => this.panelSystem.damagePanel(id, amount, false, sx, sy),
      getPanelRect: (id) => this.panelSystem.getPanelRect(id),
      playSound: (key, x) => {
          const pan = x !== undefined && halfWidth > 0 
            ? Math.max(-1, Math.min(1, x / halfWidth)) 
            : 0;
          const id = REVERSE_SOUND_MAP[key.toLowerCase()];
          if (id) {
              this.fastEvents.emit(FastEvents.PLAY_SOUND, id, pan * 100);
          } else {
              this.audio.playSound(key as any, pan);
          }
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
        if (behavior) behavior.update(entity, aiContext);
    }
  }

  teardown(): void {}
}
