import { ServiceLocator } from './ServiceLocator';
import { GameEngineCore } from './GameEngine';
import { EntityRegistry } from './ecs/EntityRegistry';
import { EntitySpawner } from './EntitySpawner';
import { registerAllBehaviors } from '../logic/ai/BehaviorCatalog';
import { SYSTEM_MANIFEST } from '../config/SystemManifest';

export const GameBootstrapper = () => {
  ServiceLocator.reset();

  // 1. Initialize Low-Level Architecture
  const registry = new EntityRegistry();
  const spawner = new EntitySpawner(registry);
  const engine = new GameEngineCore(registry);
  
  ServiceLocator.registerRegistry(registry);
  ServiceLocator.registerSpawner(spawner);

  // 2. Initialize Logic Catalogs
  registerAllBehaviors();

  // 3. Boot Systems from Manifest
  // This handles Instantiation, Registration, and Engine Injection in one pass.
  
  SYSTEM_MANIFEST.forEach(def => {
      // A. Factory: Create or Retrieve Instance
      const system = def.factory();
      
      // B. Locator: Allow other systems to find this one
      ServiceLocator.registerSystem(def.id, system);
      
      // C. Engine: Add to the Update Loop
      engine.registerSystem(system);
  });

  // 4. Setup Phase (Dependency Injection)
  // Now that all systems are registered, we let them resolve their dependencies.
  SYSTEM_MANIFEST.forEach(def => {
      const system = ServiceLocator.getSystem(def.id);
      system.setup(ServiceLocator);
  });
  
  // 5. Final Engine Prep
  engine.setup(ServiceLocator);
  spawner.spawnPlayer();

  return engine;
};
