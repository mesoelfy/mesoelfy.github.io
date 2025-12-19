import { ServiceLocator } from './ServiceLocator';
import { GameEngineCore } from '@/engine/services/GameEngine';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { EntitySpawner } from '@/engine/services/EntitySpawner';
import { registerAllBehaviors } from '@/engine/handlers/ai/BehaviorCatalog';
import { registerAllAssets } from '@/ui/sim/assets/AssetCatalog';
import { registerAllComponents } from '@/engine/ecs/ComponentCatalog';
import { PanelRegistrySystem } from '@/engine/systems/PanelRegistrySystem';
import { AudioServiceImpl } from '@/engine/audio/AudioService';
import { GameEventService } from '@/engine/signals/GameEventBus';
import { ConfigService } from '@/engine/services/ConfigService';
import { SystemPhase } from '@/engine/interfaces';

import { TimeSystem } from '@/engine/systems/TimeSystem';
import { PhysicsSystem } from '@/engine/systems/PhysicsSystem';
import { AudioDirector } from '@/engine/audio/AudioDirector';
import { InputSystem } from '@/engine/systems/InputSystem';

import { LifeCycleSystem } from '@/engine/systems/LifeCycleSystem';
import { VFXSystem } from '@/engine/systems/VFXSystem';
import { ShakeSystem } from '@/engine/systems/ShakeSystem';
import { StructureSystem } from '@/engine/systems/StructureSystem';
import { MobileWaveSystem } from '@/engine/systems/MobileWaveSystem';
import { TargetingSystem } from '@/engine/systems/TargetingSystem';
import { BehaviorSystem } from '@/engine/systems/BehaviorSystem';
import { GameStateSystem } from '@/engine/systems/GameStateSystem';
import { RenderSystem } from '@/engine/systems/RenderSystem';
import { ProjectileSystem } from '@/engine/systems/ProjectileSystem';
import { HealthSystem } from '@/engine/systems/HealthSystem';
import { ProgressionSystem } from '@/engine/systems/ProgressionSystem';
import { ParticleSystem } from '@/engine/systems/ParticleSystem';
import { OrbitalSystem } from '@/engine/systems/OrbitalSystem';
import { GuidanceSystem } from '@/engine/systems/GuidanceSystem';
import { InteractionSystem } from '@/engine/systems/InteractionSystem';

import { IGameSystem, ICombatSystem, IGameEventService, IAudioService, IEntityRegistry } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { Entity } from '@/engine/ecs/Entity';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { ComponentType } from '@/engine/ecs/ComponentType';

class MobileCombatSystem implements IGameSystem, ICombatSystem {
    constructor(
        private registry: IEntityRegistry,
        private events: IGameEventService,
        private audio: IAudioService
    ) {
        this.events.subscribe(GameEvents.ENEMY_DAMAGED, (p) => {
            const entity = this.registry.getEntity(p.id);
            if (entity && entity.active) {
                this.kill(entity);
            }
        });
    }
    
    update() {}
    teardown() {}
    resolveCollision() {}

    private kill(entity: Entity) {
        const t = entity.getComponent<TransformData>(ComponentType.Transform);
        if (t) {
            this.events.emit(GameEvents.SPAWN_FX, { type: 'EXPLOSION_PURPLE', x: t.x, y: t.y });
            this.audio.playSound('fx_impact_light');
        }
        this.registry.destroyEntity(entity.id);
    }
}

export const MobileBootstrapper = () => {
  const registry = new EntityRegistry();
  const eventBus = new GameEventService();
  const audioService = new AudioServiceImpl();
  const inputSystem = new InputSystem();
  
  const spawner = new EntitySpawner(registry);
  const engine = new GameEngineCore(registry);
  
  ServiceLocator.reset();
  ServiceLocator.register('EntityRegistry', registry);
  ServiceLocator.register('GameEventService', eventBus);
  ServiceLocator.register('AudioService', audioService);
  ServiceLocator.register('InputSystem', inputSystem);
  ServiceLocator.register('EntitySpawner', spawner);

  registerAllComponents();
  registerAllBehaviors();
  registerAllAssets();

  const panelSystem = new PanelRegistrySystem(eventBus, audioService);
  const timeSystem = new TimeSystem();
  const physicsSystem = new PhysicsSystem(registry);

  const healthSystem = new HealthSystem(eventBus, audioService, panelSystem);
  const progressionSystem = new ProgressionSystem(eventBus);
  const gameStateSystem = new GameStateSystem(
      healthSystem, progressionSystem, panelSystem, eventBus, audioService
  );
  
  const particleSystem = new ParticleSystem();
  const shakeSystem = new ShakeSystem(eventBus);
  const audioDirector = new AudioDirector(panelSystem, eventBus, audioService); // Remove fastEventBus from constructor if not needed, updating AudioDirector below
  const vfxSystem = new VFXSystem(particleSystem, shakeSystem, eventBus);
  
  const mobileCombatSystem = new MobileCombatSystem(registry, eventBus, audioService);
  const projectileSystem = new ProjectileSystem(registry);
  
  const targetingSystem = new TargetingSystem(registry, panelSystem);
  const orbitalSystem = new OrbitalSystem(registry);
  const guidanceSystem = new GuidanceSystem(registry);
  const lifeCycleSystem = new LifeCycleSystem(registry, eventBus);
  
  const interactionSystem = new InteractionSystem(inputSystem, spawner, gameStateSystem, panelSystem, eventBus);
  const structureSystem = new StructureSystem(panelSystem);
  const behaviorSystem = new BehaviorSystem(registry, spawner, ConfigService, panelSystem, particleSystem, audioService, eventBus);
  const renderSystem = new RenderSystem(registry, gameStateSystem, interactionSystem, eventBus);
  const waveSystem = new MobileWaveSystem(spawner);

  engine.injectCoreSystems(panelSystem, gameStateSystem, timeSystem);

  const systemMap = {
    TimeSystem: timeSystem,
    InputSystem: inputSystem,
    PhysicsSystem: physicsSystem,
    PanelRegistrySystem: panelSystem,
    HealthSystem: healthSystem,
    ProgressionSystem: progressionSystem,
    GameStateSystem: gameStateSystem,
    InteractionSystem: interactionSystem,
    ParticleSystem: particleSystem,
    ShakeSystem: shakeSystem
  };
  Object.entries(systemMap).forEach(([id, sys]) => ServiceLocator.registerSystem(id, sys));

  // INPUT
  engine.registerSystem(timeSystem, SystemPhase.INPUT);
  engine.registerSystem(inputSystem, SystemPhase.INPUT);
  engine.registerSystem(interactionSystem, SystemPhase.INPUT);
  
  // LOGIC
  engine.registerSystem(panelSystem, SystemPhase.LOGIC);
  engine.registerSystem(gameStateSystem, SystemPhase.LOGIC);
  engine.registerSystem(targetingSystem, SystemPhase.LOGIC);
  engine.registerSystem(waveSystem, SystemPhase.LOGIC);
  engine.registerSystem(structureSystem, SystemPhase.LOGIC);
  engine.registerSystem(behaviorSystem, SystemPhase.LOGIC);
  
  // PHYSICS
  engine.registerSystem(physicsSystem, SystemPhase.PHYSICS);
  engine.registerSystem(orbitalSystem, SystemPhase.PHYSICS);
  engine.registerSystem(guidanceSystem, SystemPhase.PHYSICS);
  engine.registerSystem(projectileSystem, SystemPhase.PHYSICS);
  
  // COLLISION
  engine.registerSystem(mobileCombatSystem, SystemPhase.COLLISION);
  
  // STATE
  engine.registerSystem(healthSystem, SystemPhase.STATE);
  engine.registerSystem(progressionSystem, SystemPhase.STATE);
  engine.registerSystem(lifeCycleSystem, SystemPhase.STATE);
  
  // RENDER
  engine.registerSystem(renderSystem, SystemPhase.RENDER);
  engine.registerSystem(particleSystem, SystemPhase.RENDER);
  engine.registerSystem(vfxSystem, SystemPhase.RENDER);
  engine.registerSystem(shakeSystem, SystemPhase.RENDER);
  engine.registerSystem(audioDirector, SystemPhase.RENDER);

  engine.setup(ServiceLocator);
  
  return engine;
};
