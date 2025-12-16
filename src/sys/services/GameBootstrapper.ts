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
import { AudioServiceImpl } from '@/engine/audio/AudioService';
import { GameEventService } from '@/engine/signals/GameEventBus';
import { FastEventService } from '@/engine/signals/FastEventBus';

export const GameBootstrapper = () => {
  const registry = new EntityRegistry();
  const spawner = new EntitySpawner(registry);
  const engine = new GameEngineCore(registry);
  
  ServiceLocator.registerRegistry(registry);
  ServiceLocator.registerSpawner(spawner);

  // Lazy Load Checks
  try { ServiceLocator.getAudioService(); } 
  catch { ServiceLocator.register('AudioService', new AudioServiceImpl()); }

  try { ServiceLocator.getGameEventBus(); } 
  catch { ServiceLocator.register('GameEventService', new GameEventService()); }

  try { ServiceLocator.getFastEventBus(); } 
  catch { ServiceLocator.register('FastEventService', new FastEventService()); }

  // Setup
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
  
  spawner.spawnPlayer();

  const world = registry.createEntity();
  world.addTag(Tag.WORLD);
  world.addComponent(ComponentBuilder[ComponentType.Render]({ r: 0, g: 1, b: 0.25, visualScale: 1.0, visualRotation: 0 }));
  registry.updateCache(world);

  return engine;
};
