import { ServiceLocator } from './ServiceLocator';
import { GameEngineCore } from '@/engine/services/GameEngine';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { EntitySpawner } from '@/engine/services/EntitySpawner';
import { registerAllBehaviors } from '@/engine/handlers/ai/BehaviorCatalog';
import { registerAllAssets } from '@/ui/sim/assets/AssetCatalog';
import { registerAllComponents } from '@/engine/ecs/ComponentCatalog';
import { PanelRegistrySystem } from '@/engine/systems/PanelRegistrySystem';
import { Tag } from '@/engine/ecs/types';
import { ComponentRegistry } from '@/engine/ecs/ComponentRegistry';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { AudioServiceImpl } from '@/engine/audio/AudioService';
import { GameEventService } from '@/engine/signals/GameEventBus';
import { ConfigService } from '@/engine/services/ConfigService';
import { SystemPhase } from '@/engine/interfaces';

import { TimeSystem } from '@/engine/systems/TimeSystem';
import { InputSystem } from '@/engine/systems/InputSystem';
import { PhysicsSystem } from '@/engine/systems/PhysicsSystem';
import { HealthSystem } from '@/engine/systems/HealthSystem';
import { ProgressionSystem } from '@/engine/systems/ProgressionSystem';
import { GameStateSystem } from '@/engine/systems/GameStateSystem';
import { AtmosphereSystem } from '@/engine/systems/AtmosphereSystem';
import { InteractionSystem } from '@/engine/systems/InteractionSystem';
import { StructureSystem } from '@/engine/systems/StructureSystem';
import { WaveSystem } from '@/engine/systems/WaveSystem';
import { ParticleSystem } from '@/engine/systems/ParticleSystem';
import { TargetingSystem } from '@/engine/systems/TargetingSystem';
import { OrbitalSystem } from '@/engine/systems/OrbitalSystem';
import { PlayerMovementSystem } from '@/engine/systems/PlayerMovementSystem';
import { WeaponSystem } from '@/engine/systems/WeaponSystem';
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

export const GameBootstrapper = () => {
  // 1. Core Services (The Backbone)
  // We explicitly create new instances. No lazy fetching.
  const registry = new EntityRegistry();
  const eventBus = new GameEventService();
  const audioService = new AudioServiceImpl(); // Note: Actual init() happens via UI trigger, but instance exists.
  const inputSystem = new InputSystem(); // Acts as both System and Service
  
  // 2. Data Services
  const spawner = new EntitySpawner(registry);
  const engine = new GameEngineCore(registry);

  // 3. Global Registration (For React UI Access)
  ServiceLocator.reset(); // Clear old references
  ServiceLocator.register('EntityRegistry', registry);
  ServiceLocator.register('GameEventService', eventBus);
  ServiceLocator.register('AudioService', audioService);
  ServiceLocator.register('InputSystem', inputSystem);
  ServiceLocator.register('EntitySpawner', spawner);

  // 4. Content Registration
  registerAllComponents();
  registerAllBehaviors();
  registerAllAssets();

  // 5. System Instantiation (Dependency Injection)
  // Order matters less here, but logical grouping helps readability.
  
  const timeSystem = new TimeSystem();
  const physicsSystem = new PhysicsSystem(registry);
  const particleSystem = new ParticleSystem();
  const shakeSystem = new ShakeSystem(eventBus);
  
  const panelSystem = new PanelRegistrySystem(eventBus, audioService); 
  const healthSystem = new HealthSystem(eventBus, audioService, panelSystem);
  const progressionSystem = new ProgressionSystem(eventBus);
  const gameStateSystem = new GameStateSystem(healthSystem, progressionSystem, panelSystem, eventBus, audioService);
  
  const interactionSystem = new InteractionSystem(inputSystem, spawner, gameStateSystem, panelSystem, eventBus);
  const structureSystem = new StructureSystem(panelSystem);
  
  const combatSystem = new CombatSystem(registry, eventBus, audioService);
  const projectileSystem = new ProjectileSystem(registry);
  const weaponSystem = new WeaponSystem(spawner, registry, gameStateSystem, eventBus, ConfigService);
  
  // Directors (Glue Logic)
  const audioDirector = new AudioDirector(panelSystem, eventBus, audioService);
  const vfxSystem = new VFXSystem(particleSystem, shakeSystem, eventBus);
  const renderSystem = new RenderSystem(registry, gameStateSystem, interactionSystem, eventBus);
  const behaviorSystem = new BehaviorSystem(registry, spawner, ConfigService, panelSystem, particleSystem, audioService, eventBus);
  
  const waveSystem = new WaveSystem(spawner, panelSystem);
  const targetingSystem = new TargetingSystem(registry, panelSystem);
  const orbitalSystem = new OrbitalSystem(registry);
  const guidanceSystem = new GuidanceSystem(registry);
  const collisionSystem = new CollisionSystem(physicsSystem, combatSystem, registry);
  const movementSystem = new PlayerMovementSystem(inputSystem, registry, interactionSystem, gameStateSystem);
  const lifeCycleSystem = new LifeCycleSystem(registry, eventBus);
  const atmosphereSystem = new AtmosphereSystem(panelSystem, registry);

  // 6. Engine Injection (Systems that engine needs direct ref to)
  engine.injectCoreSystems(panelSystem, gameStateSystem, timeSystem);

  // 7. Locator Registration (For Debug/UI tools)
  const systemMap = {
    TimeSystem: timeSystem,
    PhysicsSystem: physicsSystem,
    PanelRegistrySystem: panelSystem,
    HealthSystem: healthSystem,
    ProgressionSystem: progressionSystem,
    GameStateSystem: gameStateSystem,
    AtmosphereSystem: atmosphereSystem,
    InteractionSystem: interactionSystem,
    CombatSystem: combatSystem,
    ParticleSystem: particleSystem,
    ShakeSystem: shakeSystem,
    RenderSystem: renderSystem,
    WaveSystem: waveSystem
  };
  Object.entries(systemMap).forEach(([id, sys]) => ServiceLocator.registerSystem(id, sys));

  // 8. Pipeline Construction (Execution Order)
  
  // INPUT Phase
  engine.registerSystem(timeSystem, SystemPhase.INPUT);
  engine.registerSystem(inputSystem, SystemPhase.INPUT); 
  engine.registerSystem(interactionSystem, SystemPhase.INPUT);
  engine.registerSystem(movementSystem, SystemPhase.INPUT);
  
  // LOGIC Phase
  engine.registerSystem(panelSystem, SystemPhase.LOGIC);
  engine.registerSystem(gameStateSystem, SystemPhase.LOGIC);
  engine.registerSystem(targetingSystem, SystemPhase.LOGIC);
  engine.registerSystem(waveSystem, SystemPhase.LOGIC);
  engine.registerSystem(structureSystem, SystemPhase.LOGIC);
  engine.registerSystem(behaviorSystem, SystemPhase.LOGIC);
  engine.registerSystem(weaponSystem, SystemPhase.LOGIC);
  
  // PHYSICS Phase
  engine.registerSystem(physicsSystem, SystemPhase.PHYSICS);
  engine.registerSystem(orbitalSystem, SystemPhase.PHYSICS);
  engine.registerSystem(guidanceSystem, SystemPhase.PHYSICS);
  engine.registerSystem(projectileSystem, SystemPhase.PHYSICS);
  
  // COLLISION Phase
  engine.registerSystem(collisionSystem, SystemPhase.COLLISION);
  engine.registerSystem(combatSystem, SystemPhase.COLLISION);
  
  // STATE Phase
  engine.registerSystem(healthSystem, SystemPhase.STATE);
  engine.registerSystem(progressionSystem, SystemPhase.STATE);
  engine.registerSystem(lifeCycleSystem, SystemPhase.STATE);
  
  // RENDER Phase
  engine.registerSystem(renderSystem, SystemPhase.RENDER);
  engine.registerSystem(particleSystem, SystemPhase.RENDER);
  engine.registerSystem(vfxSystem, SystemPhase.RENDER);
  engine.registerSystem(shakeSystem, SystemPhase.RENDER);
  engine.registerSystem(atmosphereSystem, SystemPhase.RENDER);
  engine.registerSystem(audioDirector, SystemPhase.RENDER);

  // 9. Final Setup
  engine.setup(ServiceLocator);
  spawner.spawnPlayer();

  // Create World Entity
  const world = registry.createEntity();
  world.addTag(Tag.WORLD);
  world.addComponent(ComponentRegistry.create(ComponentType.Render, { r: 0, g: 0.2, b: 0, visualScale: 1.0, visualRotation: 0 }));
  registry.updateCache(world);

  return engine;
};
