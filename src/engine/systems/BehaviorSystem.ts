import { IGameSystem, IEntitySpawner, IPanelSystem, IParticleSystem, IEntityRegistry, IAudioService, IGameEventService } from '@/engine/interfaces';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { ProjectileData } from '@/engine/ecs/components/ProjectileData';
import { OrbitalData } from '@/engine/ecs/components/OrbitalData';
import { EnemyTypes, WeaponIDs, ArchetypeID } from '@/engine/config/Identifiers';
import { GameEvents } from '@/engine/signals/GameEvents'; 
import { useGameStore } from '@/engine/state/game/useGameStore';
import { ConfigService } from '@/engine/services/ConfigService';
import { AIRegistry } from '@/engine/handlers/ai/AIRegistry';
import { AIContext } from '@/engine/handlers/ai/types';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { Faction } from '@/engine/ecs/types';
import { VFXKey } from '@/engine/config/AssetKeys';

export class BehaviorSystem implements IGameSystem {
  private unsubs: (() => void)[] = [];

  constructor(
    private registry: IEntityRegistry,
    private spawner: IEntitySpawner,
    private config: typeof ConfigService,
    private panelSystem: IPanelSystem,
    private particleSystem: IParticleSystem,
    private audio: IAudioService,
    private events: IGameEventService
  ) {
    this.unsubs.push(events.subscribe(GameEvents.SPAWN_DAEMON, () => {
        const e = this.spawner.spawnEnemy(EnemyTypes.DAEMON, 0, 0);
        const orbital = e.getComponent<OrbitalData>(ComponentType.Orbital);
        if (orbital) {
            orbital.radius = 4.0;
            orbital.speed = 1.5 + Math.random() * 1.0; 
            orbital.angle = Math.random() * Math.PI * 2;
        }
    }));
  }

  update(delta: number, time: number): void {
    const aiContext: AIContext = {
      delta,
      time,
      spawnProjectile: (x, y, vx, vy, damage, configId, ownerId) => {
          let bullet;
          if (damage) {
              const finalConfig = (configId as ArchetypeID) || WeaponIDs.DAEMON_ORB;
              bullet = this.spawner.spawnProjectile(x, y, vx, vy, Faction.FRIENDLY, 2.0, damage, finalConfig);
              
              // ECS BUG FIX: Add component AND update cache
              bullet.addComponent(new IdentityData('DAEMON_SHOT'));
              this.registry.updateCache(bullet); 
              
          } else {
              const finalConfig = (configId as ArchetypeID) || WeaponIDs.ENEMY_HUNTER;
              bullet = this.spawner.spawnProjectile(x, y, vx, vy, Faction.HOSTILE, 3.0, 4, finalConfig);
          }
          if (ownerId !== undefined) {
              const proj = bullet.getComponent<ProjectileData>(ComponentType.Projectile);
              if (proj) proj.ownerId = ownerId;
          }
          return bullet;
      },
      spawnFX: (type, x, y, angle) => {
          this.events.emit(GameEvents.SPAWN_FX, { type: type as VFXKey, x, y, angle: angle || 0 });
      },
      spawnParticle: (x, y, color, vx, vy, life, size) => {
          this.particleSystem.spawn(x, y, color, vx, vy, life, size, 1);
      },
      damagePanel: (id, amount, options) => this.panelSystem.damagePanel(id, amount, options),
      getPanelRect: (id) => this.panelSystem.getPanelRect(id),
      getAllPanelRects: () => this.panelSystem.getAllPanels(),
      getPanelStress: (id) => this.panelSystem.getPanelStress(id),
      playSound: (key, x) => {
          this.events.emit(GameEvents.PLAY_SOUND, { key, x });
      },
      // PHANTOM STATE FIX: Map keys to the correct new store slices
      getUpgradeLevel: (key) => {
          const state = useGameStore.getState();
          if (key === 'SPITTER_GIRTH') return state.spitter.girthLevel;
          if (key === 'SPITTER_DAMAGE') return state.spitter.damageLevel;
          if (key === 'SPITTER_RATE') return state.spitter.rateLevel;
          if (key === 'SNIFFER_CAPACITY') return state.sniffer.capacityLevel;
          if (key === 'SNIFFER_DAMAGE') return state.sniffer.damageLevel;
          if (key === 'SNIFFER_RATE') return state.sniffer.rateLevel;
          return 0;
      },
      getEntity: (id) => this.registry.getEntity(id), 
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

  teardown(): void {
      this.unsubs.forEach(u => u());
      this.unsubs = [];
  }
}
