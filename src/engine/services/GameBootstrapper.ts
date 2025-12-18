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
import { FastEventService } from '@/engine/signals/FastEventBus';
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
  const registry = new EntityRegistry();
  const spawner = new EntitySpawner(registry);
  const engine = new GameEngineCore(registry);
  
  ServiceLocator.registerRegistry(registry);
  ServiceLocator.registerSpawner(spawner);

  let eventBus;
  try { eventBus = ServiceLocator.getGameEventBus(); } 
  catch { eventBus = new GameEventService(); ServiceLocator.register('GameEventService', eventBus); }

  let fastBus;
  try { fastBus = ServiceLocator.getFastEventBus(); } 
  catch { fastBus = new FastEventService(); ServiceLocator.register('FastEventService', fastBus); }

  let audioService;
  try { audioService = ServiceLocator.getAudioService(); } 
  catch { audioService = new AudioServiceImpl(); ServiceLocator.register('AudioService', audioService); }

  // --- REGISTRATIONS ---
  registerAllComponents();
  registerAllBehaviors();
  registerAllAssets();

  const timeSystem = new TimeSystem();
  const inputSystem = new InputSystem();
  const physicsSystem = new PhysicsSystem(registry);
  const panelSystem = new PanelRegistrySystem(eventBus, audioService); 
  const healthSystem = new HealthSystem(eventBus, audioService, panelSystem);
  const progressionSystem = new ProgressionSystem(eventBus);
  
  const gameStateSystem = new GameStateSystem(healthSystem, progressionSystem, panelSystem, eventBus, audioService);
  const atmosphere = new AtmosphereSystem(panelSystem, registry);
  
  const particles = new ParticleSystem();
  const shake = new ShakeSystem(eventBus);
  const audioDirector = new AudioDirector(panelSystem, eventBus, fastBus, audioService);
  const vfx = new VFXSystem(particles, shake, eventBus, fastBus);

  const interaction = new InteractionSystem(inputSystem, spawner, gameStateSystem, panelSystem, eventBus);
  const movement = new PlayerMovementSystem(inputSystem, registry, interaction, gameStateSystem);
  const weapons = new WeaponSystem(spawner, registry, gameStateSystem, eventBus, ConfigService);
  const behavior = new BehaviorSystem(registry, spawner, ConfigService, panelSystem, particles, audioService);
  const targeting = new TargetingSystem(registry, panelSystem);
  const projectile = new ProjectileSystem(registry);
  const combat = new CombatSystem(registry, eventBus, fastBus, audioService);
  const collision = new CollisionSystem(physicsSystem, combat, registry);
  
  const orbital = new OrbitalSystem(registry);
  const guidance = new GuidanceSystem(registry);
  const lifeCycle = new LifeCycleSystem(registry, eventBus);
  const waves = new WaveSystem(spawner, panelSystem);
  const structure = new StructureSystem(panelSystem);
  const render = new RenderSystem(registry, gameStateSystem, interaction);

  // Injection
  engine.injectCoreSystems(panelSystem, gameStateSystem, timeSystem);

  const systemMap = {
    TimeSystem: timeSystem,
    InputSystem: inputSystem,
    PhysicsSystem: physicsSystem,
    PanelRegistrySystem: panelSystem,
    HealthSystem: healthSystem,
    ProgressionSystem: progressionSystem,
    GameStateSystem: gameStateSystem,
    AtmosphereSystem: atmosphere,
    InteractionSystem: interaction,
    CombatSystem: combat,
    ParticleSystem: particles,
    ShakeSystem: shake
  };
  Object.entries(systemMap).forEach(([id, sys]) => ServiceLocator.registerSystem(id, sys));

  // --- PHASED REGISTRATION ---
  
  // 1. INPUT
  engine.registerSystem(timeSystem, SystemPhase.INPUT);
  engine.registerSystem(inputSystem, SystemPhase.INPUT);
  engine.registerSystem(interaction, SystemPhase.INPUT);
  engine.registerSystem(movement, SystemPhase.INPUT);
  
  // 2. LOGIC
  engine.registerSystem(panelSystem, SystemPhase.LOGIC);
  engine.registerSystem(gameStateSystem, SystemPhase.LOGIC);
  engine.registerSystem(targeting, SystemPhase.LOGIC);
  engine.registerSystem(waves, SystemPhase.LOGIC);
  engine.registerSystem(structure, SystemPhase.LOGIC);
  engine.registerSystem(behavior, SystemPhase.LOGIC);
  engine.registerSystem(weapons, SystemPhase.LOGIC);
  
  // 3. PHYSICS
  engine.registerSystem(physicsSystem, SystemPhase.PHYSICS);
  engine.registerSystem(orbital, SystemPhase.PHYSICS);
  engine.registerSystem(guidance, SystemPhase.PHYSICS);
  engine.registerSystem(projectile, SystemPhase.PHYSICS);
  
  // 4. COLLISION
  engine.registerSystem(collision, SystemPhase.COLLISION);
  engine.registerSystem(combat, SystemPhase.COLLISION);
  
  // 5. STATE (Post-Collision processing)
  engine.registerSystem(healthSystem, SystemPhase.STATE);
  engine.registerSystem(progressionSystem, SystemPhase.STATE);
  engine.registerSystem(lifeCycle, SystemPhase.STATE);
  
  // 6. RENDER
  engine.registerSystem(render, SystemPhase.RENDER);
  engine.registerSystem(particles, SystemPhase.RENDER);
  engine.registerSystem(vfx, SystemPhase.RENDER);
  engine.registerSystem(shake, SystemPhase.RENDER);
  engine.registerSystem(atmosphere, SystemPhase.RENDER);
  engine.registerSystem(audioDirector, SystemPhase.RENDER);

  engine.setup(ServiceLocator);
  spawner.spawnPlayer();

  const world = registry.createEntity();
  world.addTag(Tag.WORLD);
  world.addComponent(ComponentRegistry.create(ComponentType.Render, { r: 0, g: 0.2, b: 0, visualScale: 1.0, visualRotation: 0 }));
  registry.updateCache(world);

  return engine;
};
