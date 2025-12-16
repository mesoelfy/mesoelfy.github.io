import { ServiceLocator } from './ServiceLocator';
import { GameEngineCore } from '@/core/services/GameEngine';
import { EntityRegistry } from '@/core/ecs/EntityRegistry';
import { EntitySpawner } from '@/game/services/EntitySpawner';
import { registerAllBehaviors } from '@/game/handlers/ai/BehaviorCatalog';
import { registerAllAssets } from '@/ui/sim/assets/AssetCatalog';
import { AudioServiceImpl } from '@/core/audio/AudioService';
import { GameEventService } from '@/core/signals/GameEventBus';
import { FastEventService } from '@/core/signals/FastEventBus';

// Core Systems
import { TimeSystem } from '@/core/systems/TimeSystem';
import { PhysicsSystem } from '@/core/systems/PhysicsSystem';
import { AudioDirector } from '@/core/audio/AudioDirector';

// Game Systems
import { LifeCycleSystem } from '@/game/systems/LifeCycleSystem';
import { VFXSystem } from '@/game/systems/VFXSystem';
import { ShakeSystem } from '@/game/systems/ShakeSystem';
import { StructureSystem } from '@/game/systems/StructureSystem';
import { MobileWaveSystem } from '@/game/systems/MobileWaveSystem';
import { TargetingSystem } from '@/game/systems/TargetingSystem';
import { BehaviorSystem } from '@/game/systems/BehaviorSystem';
import { PanelRegistrySystem } from '@/game/systems/PanelRegistrySystem';
import { GameStateSystem } from '@/game/systems/GameStateSystem';
import { RenderSystem } from '@/game/systems/RenderSystem';
import { ProjectileSystem } from '@/game/systems/ProjectileSystem';

import { IGameSystem, ICombatSystem, IGameEventService, IFastEventService, IAudioService } from '@/core/interfaces';
import { GameEvents } from '@/core/signals/GameEvents';
import { Entity } from '@/core/ecs/Entity';
import { TransformData } from '@/game/data/TransformData';
import { ComponentType } from '@/core/ecs/ComponentType';
import { FastEvents, FX_IDS } from '@/core/signals/FastEventBus';

class MobileCombatSystem implements IGameSystem, ICombatSystem {
    private registry!: EntityRegistry;
    private events!: IGameEventService;
    private fastEvents!: IFastEventService;
    private audio!: IAudioService;

    setup(locator: ServiceLocator) {
        this.registry = locator.getRegistry() as EntityRegistry;
        this.events = locator.getGameEventBus();
        this.fastEvents = locator.getFastEventBus();
        this.audio = locator.getAudioService();
        
        this.events.subscribe(GameEvents.ENEMY_DAMAGED, (p) => {
            const entity = this.registry.getEntity(p.id);
            if (entity && entity.active) {
                this.kill(entity);
            }
        });
    }
    
    update() {}
    teardown() {}
    resolveCollision() {}

    private kill(entity: Entity) {
        const t = entity.getComponent<TransformData>(ComponentType.Transform);
        if (t) {
            const id = FX_IDS['EXPLOSION_PURPLE'];
            this.fastEvents.emit(FastEvents.SPAWN_FX, id, t.x, t.y);
            this.audio.playSound('fx_impact_light');
        }
        this.registry.destroyEntity(entity.id);
    }
}

export const MobileBootstrapper = () => {
  const registry = new EntityRegistry();
  const spawner = new EntitySpawner(registry);
  const engine = new GameEngineCore(registry);
  
  ServiceLocator.registerRegistry(registry);
  ServiceLocator.registerSpawner(spawner);

  try { ServiceLocator.getAudioService(); } catch { ServiceLocator.register('AudioService', new AudioServiceImpl()); }
  try { ServiceLocator.getGameEventBus(); } catch { ServiceLocator.register('GameEventService', new GameEventService()); }
  try { ServiceLocator.getFastEventBus(); } catch { ServiceLocator.register('FastEventService', new FastEventService()); }

  registerAllBehaviors();
  registerAllAssets();

  const panelSystem = new PanelRegistrySystem();
  ServiceLocator.registerSystem('PanelRegistrySystem', panelSystem);
  engine.registerSystem(panelSystem);

  // Manual Instantiation for Core Systems
  const timeSystem = new TimeSystem();
  const physicsSystem = new PhysicsSystem(registry);

  const systems: { id: string, sys: any }[] = [
      { id: 'TimeSystem', sys: timeSystem },
      { id: 'PhysicsSystem', sys: physicsSystem },
      { id: 'StructureSystem', sys: new StructureSystem() },
      { id: 'GameStateSystem', sys: new GameStateSystem() },
      { id: 'MobileWaveSystem', sys: new MobileWaveSystem() },
      { id: 'TargetingSystem', sys: new TargetingSystem() },
      { id: 'BehaviorSystem', sys: new BehaviorSystem() },
      { id: 'ProjectileSystem', sys: new ProjectileSystem() },
      { id: 'MobileCombatSystem', sys: new MobileCombatSystem() },
      { id: 'LifeCycleSystem', sys: new LifeCycleSystem() },
      { id: 'RenderSystem', sys: new RenderSystem() },
      { id: 'VFXSystem', sys: new VFXSystem() },
      { id: 'AudioDirectorSystem', sys: new AudioDirector() },
      { id: 'ShakeSystem', sys: new ShakeSystem() },
  ];

  systems.forEach(({ id, sys }) => {
      ServiceLocator.registerSystem(id, sys);
      engine.registerSystem(sys);
  });

  panelSystem.setup(ServiceLocator);

  // Setup Legacy Systems
  systems.forEach(({ id, sys }) => {
      if (sys.setup) sys.setup(ServiceLocator);
  });
  
  // Setup Engine (Legacy support)
  engine.setup(ServiceLocator);

  return engine;
};
