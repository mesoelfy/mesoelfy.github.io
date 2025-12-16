import { ServiceLocator } from './ServiceLocator';
import { GameEngineCore } from '@/core/services/GameEngine';
import { EntityRegistry } from '@/core/ecs/EntityRegistry';
import { EntitySpawner } from '@/game/services/EntitySpawner';
import { SYSTEM_MANIFEST } from '@/game/config/SystemManifest';
import { registerAllBehaviors } from '@/game/handlers/ai/BehaviorCatalog';
import { registerAllAssets } from '@/ui/sim/assets/AssetCatalog';
import { PanelRegistrySystem } from '@/game/systems/PanelRegistrySystem';
import { Tag } from '@/core/ecs/types';
import { ComponentBuilder } from './ComponentBuilder';
import { ComponentType } from '@/core/ecs/ComponentType';
import { AudioServiceImpl } from '@/core/audio/AudioService';
import { GameEventService } from '@/core/signals/GameEventBus';
import { FastEventService } from '@/core/signals/FastEventBus';

// Core Systems
import { TimeSystem } from '@/core/systems/TimeSystem';
import { InputSystem } from '@/core/systems/InputSystem';
import { PhysicsSystem } from '@/core/systems/PhysicsSystem';

export const GameBootstrapper = () => {
  // 1. Core Services
  const registry = new EntityRegistry();
  const spawner = new EntitySpawner(registry);
  const engine = new GameEngineCore(registry);
  
  // Register Logic Services
  // Note: We do NOT reset the Locator entirely, because UI might have registered Audio/Events already.
  ServiceLocator.registerRegistry(registry);
  ServiceLocator.registerSpawner(spawner);

  // --- FIX: SINGLETON PATTERN ---
  // Only register these if they don't exist yet. This prevents "Split Brain"
  // where UI listens to EventBus A, but Game writes to EventBus B.
  
  try { 
    ServiceLocator.getAudioService(); 
  } catch { 
    ServiceLocator.register('AudioService', new AudioServiceImpl()); 
  }

  try { 
    ServiceLocator.getGameEventBus(); 
  } catch { 
    ServiceLocator.register('GameEventService', new GameEventService()); 
  }

  try { 
    ServiceLocator.getFastEventBus(); 
  } catch { 
    ServiceLocator.register('FastEventService', new FastEventService()); 
  }

  // 2. Setup Assets
  registerAllBehaviors();
  registerAllAssets();

  // 3. Instantiate Systems
  const timeSystem = new TimeSystem();
  const inputSystem = new InputSystem();
  const physicsSystem = new PhysicsSystem(registry);
  const panelSystem = new PanelRegistrySystem(); 

  // Register Core Systems to Locator (for Legacy access)
  ServiceLocator.registerSystem('TimeSystem', timeSystem);
  ServiceLocator.registerSystem('InputSystem', inputSystem);
  ServiceLocator.registerSystem('PhysicsSystem', physicsSystem);
  ServiceLocator.registerSystem('PanelRegistrySystem', panelSystem);

  // Add to Engine
  engine.registerSystem(panelSystem);
  engine.registerSystem(timeSystem);
  engine.registerSystem(inputSystem);
  engine.registerSystem(physicsSystem);

  // -- LEGACY SYSTEMS --
  const MANUALLY_ADDED = ['TimeSystem', 'InputSystem', 'PhysicsSystem', 'PanelRegistrySystem'];

  SYSTEM_MANIFEST.forEach(def => {
      if (MANUALLY_ADDED.includes(def.id)) return;
      const system = def.factory();
      ServiceLocator.registerSystem(def.id, system);
      engine.registerSystem(system);
  });

  // 4. Initialize All
  engine.setup(ServiceLocator);
  
  // 5. Initial Spawn
  spawner.spawnPlayer();

  const world = registry.createEntity();
  world.addTag(Tag.WORLD);
  // Ensure we start with a non-zero color to avoid "black flash" issues
  world.addComponent(ComponentBuilder[ComponentType.Render]({ r: 0, g: 0.2, b: 0, visualScale: 1.0, visualRotation: 0 }));
  registry.updateCache(world);

  return engine;
};
