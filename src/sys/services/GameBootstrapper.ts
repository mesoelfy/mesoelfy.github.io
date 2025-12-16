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
import { IAudioService } from '@/engine/interfaces';

export const GameBootstrapper = () => {
  // NOTE: We do NOT reset ServiceLocator here anymore for Audio,
  // because Audio might have been initialized by the UI layer already.
  // ServiceLocator.reset() would kill the active AudioContext.
  
  // Instead, we clear specifically GAME services, but keep Global ones.
  // Ideally, ServiceLocator.reset() should accept a "keepGlobals" flag,
  // or we just manually re-register what we need. 
  // For now, let's assume we perform a soft reset or just overwrite.
  // We'll manually register the new Game Engine components.

  const registry = new EntityRegistry();
  const spawner = new EntitySpawner(registry);
  const engine = new GameEngineCore(registry);
  
  ServiceLocator.registerRegistry(registry);
  ServiceLocator.registerSpawner(spawner);

  // Check if AudioService exists, if not, create it.
  try {
      ServiceLocator.getAudioService();
  } catch {
      ServiceLocator.register('AudioService', new AudioServiceImpl());
  }

  // 2. Assets & Behavior
  registerAllBehaviors();
  registerAllAssets();

  // 3. Systems
  const panelSystem = new PanelRegistrySystem();
  ServiceLocator.registerSystem('PanelRegistrySystem', panelSystem);
  engine.registerSystem(panelSystem);

  SYSTEM_MANIFEST.forEach(def => {
      if (def.id === 'PanelRegistrySystem') return;
      const system = def.factory();
      ServiceLocator.registerSystem(def.id, system);
      engine.registerSystem(system);
  });

  // 4. Setup
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
