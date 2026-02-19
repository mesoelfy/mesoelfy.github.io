import { ServiceLocator } from './ServiceLocator';
import { GameEngineCore } from './GameEngine';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { EntitySpawner } from './EntitySpawner';
import { ConfigService } from './ConfigService';
import { AudioServiceImpl } from '@/engine/audio/AudioService';
import { SharedGameEventBus } from '@/engine/signals/GameEventBus';
import { FastEventBusImpl } from '@/engine/signals/FastEventBus';
import { UnifiedEventService } from '@/engine/signals/UnifiedEventService';
import { registerAllComponents } from '@/engine/ecs/ComponentCatalog';
import { registerAllBehaviors } from '@/engine/handlers/ai/BehaviorCatalog';
import { registerAllAssets } from '@/ui/sim/assets/AssetCatalog';
import { SystemPhase, IAudioService } from '@/engine/interfaces';

// Systems
import { TimeSystem } from '@/engine/systems/TimeSystem';
import { InputSystem } from '@/engine/systems/InputSystem';
import { PhysicsSystem } from '@/engine/systems/PhysicsSystem';
import { HealthSystem } from '@/engine/systems/HealthSystem';
import { ProgressionSystem } from '@/engine/systems/ProgressionSystem';
import { GameStateSystem } from '@/engine/systems/GameStateSystem';
import { PanelRegistrySystem } from '@/engine/systems/PanelRegistrySystem';
import { InteractionSystem } from '@/engine/systems/InteractionSystem';
import { ParticleSystem } from '@/engine/systems/ParticleSystem';
import { ShakeSystem } from '@/engine/systems/ShakeSystem';
import { RenderSystem } from '@/engine/systems/RenderSystem';
import { RenderStateSystem } from '@/engine/systems/RenderStateSystem';
import { AnimationSystem } from '@/engine/systems/AnimationSystem';
import { AudioDirector } from '@/engine/audio/AudioDirector';
import { LifeCycleSystem } from '@/engine/systems/LifeCycleSystem';
import { TargetingSystem } from '@/engine/systems/TargetingSystem';
import { OrbitalSystem } from '@/engine/systems/OrbitalSystem';
import { ProjectileSystem } from '@/engine/systems/ProjectileSystem';
import { WorldSystem } from '@/engine/systems/WorldSystem';
import { BehaviorSystem } from '@/engine/systems/BehaviorSystem';
import { VFXSystem } from '@/engine/systems/VFXSystem';
import { StateSyncSystem } from '@/engine/systems/StateSyncSystem';
import { PlayerMovementSystem } from '@/engine/systems/PlayerMovementSystem';
import { WeaponSystem } from '@/engine/systems/WeaponSystem';
import { CollisionSystem } from '@/engine/systems/CollisionSystem';
import { CombatSystem } from '@/engine/systems/CombatSystem';
import { StructureSystem } from '@/engine/systems/StructureSystem';
import { WaveSystem } from '@/engine/systems/WaveSystem';
import { WarmupSystem } from '@/engine/systems/WarmupSystem';

export class EngineFactory {
  public static create(): GameEngineCore {
    // 1. PRESERVE CRITICAL SERVICES (Like Audio Context)
    let audioService: IAudioService;
    try {
        audioService = ServiceLocator.getAudioService();
    } catch {
        audioService = new AudioServiceImpl();
    }

    // 2. STRICT MODE RESET: Wipe singletons cleanly before remounting
    ServiceLocator.reset();
    SharedGameEventBus.clear(); 
    ServiceLocator.register('AudioService', audioService);

    // 3. Core Services
    const registry = new EntityRegistry();
    const rawSlowBus = SharedGameEventBus; 
    const rawFastBus = new FastEventBusImpl();
    const eventBus = new UnifiedEventService(rawSlowBus, rawFastBus);

    const inputSystem = new InputSystem();
    const spawner = new EntitySpawner(registry);
    
    ServiceLocator.register('EntityRegistry', registry);
    ServiceLocator.register('GameEventService', eventBus);
    ServiceLocator.register('FastEventService', rawFastBus); 
    ServiceLocator.register('InputSystem', inputSystem);
    ServiceLocator.register('EntitySpawner', spawner);

    // 4. Content Registration
    registerAllComponents();
    registerAllBehaviors();
    registerAllAssets();

    // 5. Common Systems Instantiation
    const timeSystem = new TimeSystem();
    const physicsSystem = new PhysicsSystem(registry);
    const particleSystem = new ParticleSystem();
    const shakeSystem = new ShakeSystem(eventBus); 
    
    const panelSystem = new PanelRegistrySystem(eventBus, audioService);
    const healthSystem = new HealthSystem(eventBus, audioService, panelSystem);
    const progressionSystem = new ProgressionSystem(eventBus);
    const gameStateSystem = new GameStateSystem(healthSystem, progressionSystem, panelSystem, eventBus, audioService);
    
    const interactionSystem = new InteractionSystem(inputSystem, spawner, gameStateSystem, panelSystem, eventBus, physicsSystem, registry);
    
    const lifeCycleSystem = new LifeCycleSystem(registry, eventBus);
    const worldSystem = new WorldSystem(panelSystem, registry);
    
    const projectileSystem = new ProjectileSystem(registry);
    const targetingSystem = new TargetingSystem(registry, panelSystem, physicsSystem);
    const orbitalSystem = new OrbitalSystem(registry);
    
    const behaviorSystem = new BehaviorSystem(registry, spawner, ConfigService, panelSystem, particleSystem, audioService, eventBus);
    
    const audioDirector = new AudioDirector(panelSystem, eventBus, audioService);
    const vfxSystem = new VFXSystem(particleSystem, shakeSystem, eventBus, panelSystem, timeSystem);
    
    // Visual Systems
    const renderStateSystem = new RenderStateSystem(registry, gameStateSystem, interactionSystem, eventBus);
    const animationSystem = new AnimationSystem(registry, gameStateSystem, interactionSystem);
    const renderSystem = new RenderSystem(registry);
    const warmupSystem = new WarmupSystem(); 

    const movementSystem = new PlayerMovementSystem(inputSystem, registry, interactionSystem, gameStateSystem);
    const waveSystem = new WaveSystem(spawner, panelSystem, eventBus);
    const structureSystem = new StructureSystem(panelSystem);
    
    const weaponSystem = new WeaponSystem(spawner, registry, gameStateSystem, eventBus, ConfigService, physicsSystem, particleSystem);
    
    const combatSystem = new CombatSystem(registry, eventBus, rawFastBus, audioService);
    const collisionSystem = new CollisionSystem(physicsSystem, combatSystem, registry);

    const stateSyncSystem = new StateSyncSystem(healthSystem, progressionSystem, panelSystem);

    // 6. Engine Injection
    const engine = new GameEngineCore(registry);
    engine.injectCoreSystems(panelSystem, gameStateSystem, timeSystem);
    engine.injectFastEventBus(rawFastBus); 

    // 7. Registration
    const register = (sys: any, phase: SystemPhase, name?: string) => {
        engine.registerSystem(sys, phase);
        if (name) ServiceLocator.registerSystem(name, sys);
    };

    register(timeSystem, SystemPhase.INPUT, 'TimeSystem');
    register(inputSystem, SystemPhase.INPUT);
    register(interactionSystem, SystemPhase.INPUT, 'InteractionSystem');
    register(movementSystem, SystemPhase.INPUT);

    register(panelSystem, SystemPhase.LOGIC, 'PanelRegistrySystem');
    register(gameStateSystem, SystemPhase.LOGIC, 'GameStateSystem');
    register(targetingSystem, SystemPhase.LOGIC);
    register(waveSystem, SystemPhase.LOGIC, 'WaveSystem');
    register(structureSystem, SystemPhase.LOGIC);
    register(behaviorSystem, SystemPhase.LOGIC); 
    register(weaponSystem, SystemPhase.LOGIC);   

    register(physicsSystem, SystemPhase.PHYSICS, 'PhysicsSystem');
    register(orbitalSystem, SystemPhase.PHYSICS);
    register(projectileSystem, SystemPhase.PHYSICS);

    register(collisionSystem, SystemPhase.COLLISION);
    register(combatSystem, SystemPhase.COLLISION, 'CombatSystem');

    register(healthSystem, SystemPhase.STATE, 'HealthSystem');
    register(progressionSystem, SystemPhase.STATE, 'ProgressionSystem');
    register(lifeCycleSystem, SystemPhase.STATE);
    register(stateSyncSystem, SystemPhase.STATE);

    // RENDER PHASE
    register(renderStateSystem, SystemPhase.RENDER, 'RenderStateSystem');
    register(animationSystem, SystemPhase.RENDER, 'AnimationSystem');
    
    // Core Rendering
    register(renderSystem, SystemPhase.RENDER, 'RenderSystem');
    register(warmupSystem, SystemPhase.RENDER);
    
    register(particleSystem, SystemPhase.RENDER, 'ParticleSystem');
    register(vfxSystem, SystemPhase.RENDER);
    register(shakeSystem, SystemPhase.RENDER, 'ShakeSystem');
    register(worldSystem, SystemPhase.RENDER, 'WorldSystem');
    register(audioDirector, SystemPhase.RENDER);

    engine.setup(ServiceLocator);
    spawner.spawnPlayer();

    ServiceLocator.register('ParticleSystem', particleSystem);

    return engine;
  }
}
