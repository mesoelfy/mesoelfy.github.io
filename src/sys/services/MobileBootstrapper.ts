import { ServiceLocator } from './ServiceLocator';
import { GameEngineCore } from './GameEngine';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { EntitySpawner } from '@/sys/services/EntitySpawner';
import { registerAllBehaviors } from '@/sys/handlers/ai/BehaviorCatalog';
import { registerAllAssets } from '@/ui/sim/assets/AssetCatalog';

// Systems
import { TimeSystem } from '@/sys/systems/TimeSystem';
import { PhysicsSystem } from '@/sys/systems/PhysicsSystem';
import { LifeCycleSystem } from '@/sys/systems/LifeCycleSystem';
import { VFXSystem } from '@/sys/systems/VFXSystem';
import { AudioDirector } from '@/engine/audio/AudioDirector';
import { ShakeSystem } from '@/sys/systems/ShakeSystem';
import { StructureSystem } from '@/sys/systems/StructureSystem';
import { MobileWaveSystem } from '@/sys/systems/MobileWaveSystem';
import { TargetingSystem } from '@/sys/systems/TargetingSystem';
import { BehaviorSystem } from '@/sys/systems/BehaviorSystem';
import { PanelRegistry } from '@/sys/systems/PanelRegistrySystem';
import { GameStateSystem } from '@/sys/systems/GameStateSystem'; // Added

// Simplified Combat System for Tap-to-Kill
import { IGameSystem, ICombatSystem } from '@/engine/interfaces';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { FastEventBus, FastEvents, FX_IDS } from '@/engine/signals/FastEventBus';
import { Entity } from '@/engine/ecs/Entity';
import { TransformData } from '@/sys/data/TransformData';

// --- MICRO COMBAT SYSTEM (Mobile Specific) ---
class MobileCombatSystem implements IGameSystem, ICombatSystem {
    private registry!: EntityRegistry;

    setup(locator: ServiceLocator) {
        this.registry = locator.getRegistry() as EntityRegistry;
        
        // Listen for Tap Kills
        GameEventBus.subscribe(GameEvents.ENEMY_DAMAGED, (p) => {
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
        const t = entity.getComponent<TransformData>('Transform');
        if (t) {
            const id = FX_IDS['EXPLOSION_PURPLE'];
            FastEventBus.emit(FastEvents.SPAWN_FX, id, t.x, t.y);
            AudioSystem.playSound('fx_impact_light');
        }
        this.registry.destroyEntity(entity.id);
    }
}

export const MobileBootstrapper = () => {
  ServiceLocator.reset();

  const registry = new EntityRegistry();
  const spawner = new EntitySpawner(registry);
  const engine = new GameEngineCore(registry);
  
  ServiceLocator.registerRegistry(registry);
  ServiceLocator.registerSpawner(spawner);

  // Initialize Catalogs
  registerAllBehaviors();
  registerAllAssets();

  // --- REGISTER LEAN SYSTEM STACK ---
  const systems: { id: string, sys: any }[] = [
      { id: 'TimeSystem', sys: new TimeSystem() },
      { id: 'PanelRegistrySystem', sys: PanelRegistry }, 
      { id: 'StructureSystem', sys: new StructureSystem() },
      { id: 'GameStateSystem', sys: new GameStateSystem() }, // Register Dependency
      { id: 'MobileWaveSystem', sys: new MobileWaveSystem() },
      { id: 'TargetingSystem', sys: new TargetingSystem() },
      { id: 'BehaviorSystem', sys: new BehaviorSystem() },
      { id: 'PhysicsSystem', sys: new PhysicsSystem() },
      { id: 'MobileCombatSystem', sys: new MobileCombatSystem() },
      { id: 'LifeCycleSystem', sys: new LifeCycleSystem() },
      { id: 'VFXSystem', sys: new VFXSystem() },
      { id: 'AudioDirectorSystem', sys: new AudioDirector() },
      { id: 'ShakeSystem', sys: new ShakeSystem() },
  ];

  systems.forEach(({ id, sys }) => {
      ServiceLocator.registerSystem(id, sys);
      engine.registerSystem(sys);
  });

  systems.forEach(({ id }) => {
      const sys = ServiceLocator.getSystem(id);
      sys.setup(ServiceLocator);
  });
  
  engine.setup(ServiceLocator);

  return engine;
};
