import { ServiceLocator } from './ServiceLocator';
import { GameEngineCore } from '@/engine/services/GameEngine';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { EntitySpawner } from '@/engine/services/EntitySpawner';
import { registerAllBehaviors } from '@/engine/handlers/ai/BehaviorCatalog';
import { registerAllAssets } from '@/ui/sim/assets/AssetCatalog';
import { PanelRegistrySystem } from '@/engine/systems/PanelRegistrySystem';
import { AudioServiceImpl } from '@/engine/audio/AudioService';
import { GameEventService } from '@/engine/signals/GameEventBus';
import { FastEventService } from '@/engine/signals/FastEventBus';
import { ConfigService } from '@/engine/services/ConfigService';

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

import { IGameSystem, ICombatSystem, IGameEventService, IFastEventService, IAudioService, IEntityRegistry } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { Entity } from '@/engine/ecs/Entity';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { FastEvents, FX_IDS } from '@/engine/signals/FastEventBus';

class MobileCombatSystem implements IGameSystem, ICombatSystem {
    constructor(
        private registry: IEntityRegistry,
        private events: IGameEventService,
        private fastEvents: IFastEventService,
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
            const id = FX_IDS['EXPLOSION_PURPLE'];
            this.fastEvents.emit(FastEvents.SPAWN_FX, id, t.x, t.y);
            this.audio.playSound('fx_impact_light');
        }
        this.registry.destroyEntity(entity.id);
    }
}

export const MobileBootstrapper = () => {
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

  const panelSystem = new PanelRegistrySystem(eventService, audioService);
  ServiceLocator.registerSystem('PanelRegistrySystem', panelSystem);
  engine.registerSystem(panelSystem);

  const timeSystem = new TimeSystem();
  const physicsSystem = new PhysicsSystem(registry);
  const inputSystem = new InputSystem(); 

  const healthSystem = new HealthSystem(eventService, audioService, panelSystem);
  const progressionSystem = new ProgressionSystem(eventService);
  const gameStateSystem = new GameStateSystem(
      healthSystem, progressionSystem, panelSystem, registry, eventService, audioService
  );
  
  const particleSystem = new ParticleSystem();
  const shakeSystem = new ShakeSystem(eventService);
  const audioDirector = new AudioDirector(panelSystem, eventService, fastEventService, audioService);
  const vfxSystem = new VFXSystem(particleSystem, shakeSystem, eventService, fastEventService);
  
  const mobileCombatSystem = new MobileCombatSystem(registry, eventService, fastEventService, audioService);
  const projectileSystem = new ProjectileSystem(registry);
  
  const targetingSystem = new TargetingSystem(registry, panelSystem);
  const orbitalSystem = new OrbitalSystem(registry);
  const guidanceSystem = new GuidanceSystem(registry);
  const lifeCycleSystem = new LifeCycleSystem(registry, eventService);
  
  // UPDATED: Added eventService
  const interactionSystem = new InteractionSystem(inputSystem, spawner, gameStateSystem, panelSystem, eventService);
  const structureSystem = new StructureSystem(panelSystem);
  const behaviorSystem = new BehaviorSystem(registry, spawner, ConfigService, panelSystem, particleSystem, audioService);
  const renderSystem = new RenderSystem(registry, gameStateSystem, interactionSystem);

  const systems: { id: string, sys: any }[] = [
      { id: 'TimeSystem', sys: timeSystem },
      { id: 'PhysicsSystem', sys: physicsSystem },
      { id: 'StructureSystem', sys: structureSystem },
      { id: 'GameStateSystem', sys: gameStateSystem },
      { id: 'MobileWaveSystem', sys: new MobileWaveSystem() },
      { id: 'TargetingSystem', sys: targetingSystem },
      { id: 'BehaviorSystem', sys: behaviorSystem },
      { id: 'ParticleSystem', sys: particleSystem },
      { id: 'ProjectileSystem', sys: projectileSystem },
      { id: 'MobileCombatSystem', sys: mobileCombatSystem },
      { id: 'LifeCycleSystem', sys: lifeCycleSystem },
      { id: 'RenderSystem', sys: renderSystem },
      { id: 'VFXSystem', sys: vfxSystem },
      { id: 'AudioDirectorSystem', sys: audioDirector },
      { id: 'ShakeSystem', sys: shakeSystem },
  ];

  systems.forEach(({ id, sys }) => {
      ServiceLocator.registerSystem(id, sys);
      engine.registerSystem(sys);
  });

  engine.setup(ServiceLocator);
  
  return engine;
};
