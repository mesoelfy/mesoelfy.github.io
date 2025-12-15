import { ServiceLocator } from './ServiceLocator';
import { GameEngineCore } from './GameEngine';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { EntitySpawner } from '@/sys/services/EntitySpawner';
import { SYSTEM_MANIFEST } from '@/sys/config/SystemManifest';
import { registerAllBehaviors } from '@/sys/handlers/ai/BehaviorCatalog';
import { registerAllAssets } from '@/ui/sim/assets/AssetCatalog';
import { PanelRegistrySystem } from '@/sys/systems/PanelRegistrySystem';

export const GameBootstrapper = () => {
  ServiceLocator.reset();

  const registry = new EntityRegistry();
  const spawner = new EntitySpawner(registry);
  const engine = new GameEngineCore(registry);
  
  ServiceLocator.registerRegistry(registry);
  ServiceLocator.registerSpawner(spawner);

  registerAllBehaviors();
  registerAllAssets();

  // Create PanelSystem instance manually to ensure we control its lifecycle
  const panelSystem = new PanelRegistrySystem();
  ServiceLocator.registerSystem('PanelRegistrySystem', panelSystem);
  engine.registerSystem(panelSystem);

  // Boot remaining systems
  SYSTEM_MANIFEST.forEach(def => {
      // PanelRegistrySystem is already registered, skip it
      if (def.id === 'PanelRegistrySystem') return;
      
      const system = def.factory();
      ServiceLocator.registerSystem(def.id, system);
      engine.registerSystem(system);
  });

  // Setup Phase
  // Manually setup PanelSystem first as others might depend on it
  panelSystem.setup(ServiceLocator);

  SYSTEM_MANIFEST.forEach(def => {
      if (def.id === 'PanelRegistrySystem') return;
      const system = ServiceLocator.getSystem(def.id);
      system.setup(ServiceLocator);
  });
  
  engine.setup(ServiceLocator);
  spawner.spawnPlayer();

  return engine;
};
