import { ServiceLocator } from './ServiceLocator';
import { GameEngineCore } from '@/engine/services/GameEngine';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { EntitySpawner } from '@/engine/services/EntitySpawner';
import { registerAllBehaviors } from '@/engine/handlers/ai/BehaviorCatalog';
import { registerAllAssets } from '@/ui/sim/assets/AssetCatalog';
import { PanelRegistrySystem } from '@/engine/systems/PanelRegistrySystem';
import { Tag } from '@/engine/ecs/types';
import { ComponentBuilder } from './ComponentBuilder';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { AudioServiceImpl } from '@/engine/audio/AudioService';
import { GameEventService } from '@/engine/signals/GameEventBus';
import { FastEventService } from '@/engine/signals/FastEventBus';
import { ConfigService } from '@/engine/services/ConfigService';

import { TimeSystem } from '@/engine/systems/TimeSystem';
import { InputSystem } from '@/engine/systems/InputSystem';
import { PhysicsSystem } from '@/engine/systems/PhysicsSystem';

import { HealthSystem } from '@/engine/systems/HealthSystem';
import { ProgressionSystem } from '@/engine/systems/ProgressionSystem';
import { GameStateSystem } from '@/engine/systems/GameStateSystem';

import { InteractionSystem } from '@/engine/systems/InteractionSystem';
import { StructureSystem } from '@/engine/systems/StructureSystem';
import { WaveSystem } from '@/engine/systems/WaveSystem';
import { ParticleSystem } from '@/engine/systems/ParticleSystem';
import { TargetingSystem } from '@/engine/systems/TargetingSystem';
import { OrbitalSystem } from '@/engine/systems/OrbitalSystem';
import { PlayerSystem } from '@/engine/systems/PlayerSystem';
import { BehaviorSystem } from '@/engine/systems/BehaviorSystem';
import { GuidanceSystem } from '@/engine/systems/GuidanceSystem';
import { ProjectileSystem } from '@/engine/systems/ProjectileSystem';
import { CollisionSystem } from '@/engine/systems/CollisionSystem';
import { CombatSystem } from '@/engine/systems/CombatSystem';
import { LifeCycleSystem } from '@/engine/systems/LifeCycleSystem';
import { RenderSystem } from '@/engine/systems/RenderSystem';
import { VFXSystem } from '@/engine/systems/VFXSystem';
import { AudioDirector } from '@/engine/audio/AudioDirector';
import { ShakeSystem } from '@/engine/systems/ShakeSystem';
import { UISyncSystem } from '@/engine/systems/UISyncSystem';

export const GameBootstrapper = () => {
  const registry = new EntityRegistry();
  const spawner = new EntitySpawner(registry);
  const engine = new GameEngineCore(registry);
  
  ServiceLocator.registerRegistry(registry);
  ServiceLocator.registerSpawner(spawner);

  let audioService;
  try { audioService = ServiceLocator.getAudioService(); } 
  catch { audioService = new AudioServiceImpl(); ServiceLocator.register('AudioService', audioService); }

  let eventService;
  try { eventService = ServiceLocator.getGameEventBus(); } 
  catch { eventService = new GameEventService(); ServiceLocator.register('GameEventService', eventService); }

  let fastEventService;
  try { fastEventService = ServiceLocator.getFastEventBus(); } 
  catch { fastEventService = new FastEventService(); ServiceLocator.register('FastEventService', fastEventService); }

  registerAllBehaviors();
  registerAllAssets();

  const timeSystem = new TimeSystem();
  const inputSystem = new InputSystem();
  const physicsSystem = new PhysicsSystem(registry);
  const panelSystem = new PanelRegistrySystem(eventService, audioService); 

  ServiceLocator.registerSystem('TimeSystem', timeSystem);
  ServiceLocator.registerSystem('InputSystem', inputSystem);
  ServiceLocator.registerSystem('PhysicsSystem', physicsSystem);
  ServiceLocator.registerSystem('PanelRegistrySystem', panelSystem);

  engine.registerSystem(panelSystem);
  engine.registerSystem(timeSystem);
  engine.registerSystem(inputSystem);
  engine.registerSystem(physicsSystem);

  // --- INJECTED SYSTEMS ---
  const healthSystem = new HealthSystem(eventService, audioService, panelSystem);
  const progressionSystem = new ProgressionSystem(eventService);
  const gameStateSystem = new GameStateSystem(
      healthSystem, 
      progressionSystem, 
      panelSystem, 
      registry, 
      eventService, 
      audioService
  );
  
  const particleSystem = new ParticleSystem();
  const shakeSystem = new ShakeSystem(eventService);
  const audioDirector = new AudioDirector(panelSystem, eventService, fastEventService, audioService);
  const vfxSystem = new VFXSystem(particleSystem, shakeSystem, eventService, fastEventService);

  const projectileSystem = new ProjectileSystem(registry);
  const combatSystem = new CombatSystem(gameStateSystem, registry, eventService, fastEventService, audioService);
  const collisionSystem = new CollisionSystem(physicsSystem, combatSystem, registry);

  const targetingSystem = new TargetingSystem(registry, panelSystem);
  const orbitalSystem = new OrbitalSystem(registry);
  const guidanceSystem = new GuidanceSystem(registry);
  const lifeCycleSystem = new LifeCycleSystem(registry, eventService);

  const interactionSystem = new InteractionSystem(inputSystem, spawner, gameStateSystem, panelSystem);
  const behaviorSystem = new BehaviorSystem(registry, spawner, ConfigService, panelSystem, particleSystem, audioService);
  const playerSystem = new PlayerSystem(inputSystem, spawner, gameStateSystem, interactionSystem, registry, ConfigService);

  const waveSystem = new WaveSystem(spawner, panelSystem);
  const structureSystem = new StructureSystem(panelSystem);
  const uiSyncSystem = new UISyncSystem(gameStateSystem, interactionSystem, panelSystem);
  const renderSystem = new RenderSystem(registry, gameStateSystem, interactionSystem);

  // Register for Locator (Legacy Bridge & UI Access)
  ServiceLocator.registerSystem('HealthSystem', healthSystem);
  ServiceLocator.registerSystem('ProgressionSystem', progressionSystem);
  ServiceLocator.registerSystem('GameStateSystem', gameStateSystem);
  ServiceLocator.registerSystem('CombatSystem', combatSystem);
  ServiceLocator.registerSystem('ParticleSystem', particleSystem);
  ServiceLocator.registerSystem('ShakeSystem', shakeSystem);
  ServiceLocator.registerSystem('InteractionSystem', interactionSystem);

  // Register to Engine (Order matters)
  // 1. Logic
  engine.registerSystem(healthSystem);
  engine.registerSystem(progressionSystem);
  engine.registerSystem(gameStateSystem);
  
  engine.registerSystem(waveSystem);
  engine.registerSystem(structureSystem);
  
  engine.registerSystem(targetingSystem);
  engine.registerSystem(orbitalSystem);
  engine.registerSystem(guidanceSystem);
  engine.registerSystem(playerSystem);
  engine.registerSystem(behaviorSystem);
  engine.registerSystem(interactionSystem);

  // 2. Physics/Combat
  engine.registerSystem(projectileSystem);
  engine.registerSystem(collisionSystem);
  engine.registerSystem(combatSystem);
  engine.registerSystem(lifeCycleSystem);

  // 3. Visuals/Audio
  engine.registerSystem(particleSystem);
  engine.registerSystem(shakeSystem);
  engine.registerSystem(renderSystem);
  engine.registerSystem(vfxSystem);
  engine.registerSystem(audioDirector);
  
  // 4. UI
  engine.registerSystem(uiSyncSystem);

  // Remove setup(locator) calls as dependencies are now injected!
  engine.setup(ServiceLocator);
  
  spawner.spawnPlayer();

  const world = registry.createEntity();
  world.addTag(Tag.WORLD);
  world.addComponent(ComponentBuilder[ComponentType.Render]({ r: 0, g: 0.2, b: 0, visualScale: 1.0, visualRotation: 0 }));
  registry.updateCache(world);

  return engine;
};
