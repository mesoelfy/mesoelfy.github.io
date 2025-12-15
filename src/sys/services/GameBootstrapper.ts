import { ServiceLocator } from './ServiceLocator';
import { GameEngineCore } from './GameEngine';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { EntitySpawner } from '@/sys/services/EntitySpawner';
import { SYSTEM_MANIFEST } from '@/sys/config/SystemManifest';

// Registries
import { registerAllBehaviors } from '@/sys/handlers/ai/BehaviorCatalog';
import { registerAllAssets } from '@/ui/sim/assets/AssetCatalog'; // NEW

export const GameBootstrapper = () => {
  ServiceLocator.reset();

  const registry = new EntityRegistry();
  const spawner = new EntitySpawner(registry);
  const engine = new GameEngineCore(registry);
  
  ServiceLocator.registerRegistry(registry);
  ServiceLocator.registerSpawner(spawner);

  // Initialize Catalogs
  registerAllBehaviors();
  registerAllAssets(); // NEW

  // Boot Systems
  SYSTEM_MANIFEST.forEach(def => {
      const system = def.factory();
      ServiceLocator.registerSystem(def.id, system);
      engine.registerSystem(system);
  });

  SYSTEM_MANIFEST.forEach(def => {
      const system = ServiceLocator.getSystem(def.id);
      system.setup(ServiceLocator);
  });
  
  engine.setup(ServiceLocator);
  spawner.spawnPlayer();

  return engine;
};
