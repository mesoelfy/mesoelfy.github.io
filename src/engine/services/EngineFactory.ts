import { ServiceLocator } from './ServiceLocator';
import { GameEngineCore } from './GameEngine';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { EntitySpawner } from './EntitySpawner';
import { ConfigService } from './ConfigService';
import { AudioServiceImpl } from '@/engine/audio/AudioService';
import { GameEventService } from '@/engine/signals/GameEventBus';
import { FastEventBusImpl } from '@/engine/signals/FastEventBus';
import { registerAllComponents } from '@/engine/ecs/ComponentCatalog';
import { registerAllBehaviors } from '@/engine/handlers/ai/BehaviorCatalog';
import { registerAllAssets } from '@/ui/sim/assets/AssetCatalog';
import { SystemPhase } from '@/engine/interfaces';

// Common Systems
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
import { VisualSystem } from '@/engine/systems/VisualSystem';
import { AudioDirector } from '@/engine/audio/AudioDirector';
import { LifeCycleSystem } from '@/engine/systems/LifeCycleSystem';
import { TargetingSystem } from '@/engine/systems/TargetingSystem';
import { OrbitalSystem } from '@/engine/systems/OrbitalSystem';
import { GuidanceSystem } from '@/engine/systems/GuidanceSystem';
import { ProjectileSystem } from '@/engine/systems/ProjectileSystem';
import { WorldSystem } from '@/engine/systems/WorldSystem';
import { BehaviorSystem } from '@/engine/systems/BehaviorSystem';
import { VFXSystem } from '@/engine/systems/VFXSystem';
import { FeedbackBridgeSystem } from '@/engine/systems/FeedbackBridgeSystem';

// Mode Specific Systems
import { PlayerMovementSystem } from '@/engine/systems/PlayerMovementSystem';
import { WeaponSystem } from '@/engine/systems/WeaponSystem';
import { CollisionSystem } from '@/engine/systems/CollisionSystem';
import { CombatSystem } from '@/engine/systems/CombatSystem';
import { StructureSystem } from '@/engine/systems/StructureSystem';
import { WaveSystem } from '@/engine/systems/WaveSystem';
import { MobileWaveSystem } from '@/engine/systems/MobileWaveSystem';
import { MobileCombatSystem } from '@/engine/systems/MobileCombatSystem';

export type EngineMode = 'DESKTOP' | 'MOBILE';

export class EngineFactory {
  public static create(mode: EngineMode): GameEngineCore {
    // 1. Core Services
    const registry = new EntityRegistry();
    const eventBus = new GameEventService();
    const fastEventBus = new FastEventBusImpl();
    const audioService = new AudioServiceImpl();
    const inputSystem = new InputSystem();
    const spawner = new EntitySpawner(registry);
    
    // 2. Global Registration
    ServiceLocator.reset();
    ServiceLocator.register('EntityRegistry', registry);
    ServiceLocator.register('GameEventService', eventBus);
    ServiceLocator.register('FastEventService', fastEventBus);
    ServiceLocator.register('AudioService', audioService);
    ServiceLocator.register('InputSystem', inputSystem);
    ServiceLocator.register('EntitySpawner', spawner);

    // 3. Content Registration
    registerAllComponents();
    registerAllBehaviors();
    registerAllAssets();

    // 4. Common Systems Instantiation
    const timeSystem = new TimeSystem();
    const physicsSystem = new PhysicsSystem(registry);
    const particleSystem = new ParticleSystem();
    const shakeSystem = new ShakeSystem(eventBus, fastEventBus);
    
    const panelSystem = new PanelRegistrySystem(eventBus, audioService);
    const healthSystem = new HealthSystem(eventBus, audioService, panelSystem);
    const progressionSystem = new ProgressionSystem(eventBus);
    const gameStateSystem = new GameStateSystem(healthSystem, progressionSystem, panelSystem, eventBus, audioService);
    
    const interactionSystem = new InteractionSystem(inputSystem, spawner, gameStateSystem, panelSystem, eventBus);
    const lifeCycleSystem = new LifeCycleSystem(registry, eventBus);
    const worldSystem = new WorldSystem(panelSystem, registry);
    
    const projectileSystem = new ProjectileSystem(registry);
    const targetingSystem = new TargetingSystem(registry, panelSystem);
    const orbitalSystem = new OrbitalSystem(registry);
    const guidanceSystem = new GuidanceSystem(registry);
    
    const behaviorSystem = new BehaviorSystem(registry, spawner, ConfigService, panelSystem, particleSystem, audioService, eventBus, fastEventBus);
    const feedbackBridge = new FeedbackBridgeSystem(eventBus, fastEventBus, panelSystem);
    
    // Directors
    const audioDirector = new AudioDirector(panelSystem, eventBus, fastEventBus, audioService);
    const vfxSystem = new VFXSystem(particleSystem, shakeSystem, eventBus, fastEventBus);
    const renderSystem = new RenderSystem(registry, gameStateSystem, interactionSystem, eventBus);
    const visualSystem = new VisualSystem(registry);

    // 5. Engine Injection
    const engine = new GameEngineCore(registry);
    engine.injectCoreSystems(panelSystem, gameStateSystem, timeSystem);
    engine.injectFastEventBus(fastEventBus);

    // 6. System Registration Helpers
    const register = (sys: any, phase: SystemPhase, name?: string) => {
        engine.registerSystem(sys, phase);
        if (name) ServiceLocator.registerSystem(name, sys);
    };

    // --- PIPELINE CONSTRUCTION ---

    // PHASE 0: INPUT
    register(timeSystem, SystemPhase.INPUT, 'TimeSystem');
    // FIX: Removed 'InputSystem' name to prevent double registration warning
    // (It is already registered in step 2 as IInputService)
    register(inputSystem, SystemPhase.INPUT);
    register(interactionSystem, SystemPhase.INPUT, 'InteractionSystem');
    
    if (mode === 'DESKTOP') {
        const movementSystem = new PlayerMovementSystem(inputSystem, registry, interactionSystem, gameStateSystem);
        register(movementSystem, SystemPhase.INPUT);
    }

    // PHASE 1: LOGIC
    register(panelSystem, SystemPhase.LOGIC, 'PanelRegistrySystem');
    register(gameStateSystem, SystemPhase.LOGIC, 'GameStateSystem');
    register(targetingSystem, SystemPhase.LOGIC);
    
    if (mode === 'DESKTOP') {
        const waveSystem = new WaveSystem(spawner, panelSystem);
        const structureSystem = new StructureSystem(panelSystem);
        const weaponSystem = new WeaponSystem(spawner, registry, gameStateSystem, eventBus, fastEventBus, ConfigService);
        
        register(waveSystem, SystemPhase.LOGIC, 'WaveSystem');
        register(structureSystem, SystemPhase.LOGIC);
        register(behaviorSystem, SystemPhase.LOGIC); 
        register(weaponSystem, SystemPhase.LOGIC);   
    } else {
        const mobileWaveSystem = new MobileWaveSystem(spawner);
        register(mobileWaveSystem, SystemPhase.LOGIC);
        register(behaviorSystem, SystemPhase.LOGIC); 
    }

    // PHASE 2: PHYSICS
    register(physicsSystem, SystemPhase.PHYSICS, 'PhysicsSystem');
    register(orbitalSystem, SystemPhase.PHYSICS);
    register(guidanceSystem, SystemPhase.PHYSICS);
    register(projectileSystem, SystemPhase.PHYSICS);

    // PHASE 3: COLLISION
    if (mode === 'DESKTOP') {
        const combatSystem = new CombatSystem(registry, eventBus, fastEventBus, audioService);
        const collisionSystem = new CollisionSystem(physicsSystem, combatSystem, registry);
        
        register(collisionSystem, SystemPhase.COLLISION);
        register(combatSystem, SystemPhase.COLLISION, 'CombatSystem');
    } else {
        const mobileCombat = new MobileCombatSystem(registry, eventBus, fastEventBus, audioService);
        register(mobileCombat, SystemPhase.COLLISION);
    }

    // PHASE 4: STATE
    register(healthSystem, SystemPhase.STATE, 'HealthSystem');
    register(progressionSystem, SystemPhase.STATE, 'ProgressionSystem');
    register(lifeCycleSystem, SystemPhase.STATE);
    register(feedbackBridge, SystemPhase.STATE); 

    // PHASE 5: RENDER
    register(renderSystem, SystemPhase.RENDER, 'RenderSystem');
    register(visualSystem, SystemPhase.RENDER, 'VisualSystem');
    register(particleSystem, SystemPhase.RENDER, 'ParticleSystem');
    register(vfxSystem, SystemPhase.RENDER);
    register(shakeSystem, SystemPhase.RENDER, 'ShakeSystem');
    register(worldSystem, SystemPhase.RENDER, 'WorldSystem');
    register(audioDirector, SystemPhase.RENDER);

    // 7. Final Setup
    engine.setup(ServiceLocator);

    // 8. Player Spawn (Desktop Only)
    if (mode === 'DESKTOP') {
        spawner.spawnPlayer();
    }

    return engine;
  }
}
