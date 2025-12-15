import { ServiceLocator } from './ServiceLocator';
import { GameEngineCore } from './GameEngine';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { EntitySpawner } from '@/sys/services/EntitySpawner';
import { SYSTEM_MANIFEST } from '@/sys/config/SystemManifest';
import { registerAllBehaviors } from '@/sys/handlers/ai/BehaviorCatalog';
import { registerAllAssets } from '@/ui/sim/assets/AssetCatalog';
import { PanelRegistrySystem } from '@/sys/systems/PanelRegistrySystem';
import { Tag } from '@/engine/ecs/types';
import { ComponentBuilder } from './ComponentBuilder';
import { ComponentType } from '@/engine/ecs/ComponentType';

export const GameBootstrapper = () => {
  ServiceLocator.reset();

  const registry = new EntityRegistry();
  const spawner = new EntitySpawner(registry);
  const engine = new GameEngineCore(registry);
  
  ServiceLocator.registerRegistry(registry);
  ServiceLocator.registerSpawner(spawner);

  registerAllBehaviors();
  registerAllAssets();

  const panelSystem = new PanelRegistrySystem();
  ServiceLocator.registerSystem('PanelRegistrySystem', panelSystem);
  engine.registerSystem(panelSystem);

  SYSTEM_MANIFEST.forEach(def => {
      if (def.id === 'PanelRegistrySystem') return;
      const system = def.factory();
      ServiceLocator.registerSystem(def.id, system);
      engine.registerSystem(system);
  });

  panelSystem.setup(ServiceLocator);

  SYSTEM_MANIFEST.forEach(def => {
      if (def.id === 'PanelRegistrySystem') return;
      const system = ServiceLocator.getSystem(def.id);
      system.setup(ServiceLocator);
  });
  
  engine.setup(ServiceLocator);
  
  // 1. Spawn Player
  spawner.spawnPlayer();

  // 2. Spawn World Entity (Global Visual State)
  const world = registry.createEntity();
  world.addTag(Tag.WORLD);
  // Default: Green, Normal Speed (1.0), 0 Rotation
  world.addComponent(ComponentBuilder[ComponentType.Render]({ r: 0, g: 1, b: 0.25, visualScale: 1.0, visualRotation: 0 }));
  registry.updateCache(world);

  return engine;
};
