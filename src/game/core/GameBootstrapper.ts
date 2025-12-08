import { ServiceLocator } from './ServiceLocator';
import { GameEngineCore } from './GameEngine';
import { EntityRegistry } from './ecs/EntityRegistry';
import { EntitySpawner } from './EntitySpawner';

// Systems
import { TimeSystem } from '../systems/TimeSystem';
import { InputSystem } from '../systems/InputSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { LifeCycleSystem } from '../systems/LifeCycleSystem';
import { BehaviorSystem } from '../systems/BehaviorSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { PlayerSystem } from '../systems/PlayerSystem';
import { InteractionSystem } from '../systems/InteractionSystem';
import { CameraSystem } from '../systems/CameraSystem';
import { PanelRegistry } from '../systems/PanelRegistrySystem'; 
import { GameStateSystem } from '../systems/GameStateSystem'; 
import { UISyncSystem } from '../systems/UISyncSystem'; 
import { TargetingSystem } from '../systems/TargetingSystem'; // NEW

export const GameBootstrapper = () => {
  ServiceLocator.reset();

  const registry = new EntityRegistry();
  const spawner = new EntitySpawner(registry);
  const engine = new GameEngineCore(registry);
  
  ServiceLocator.registerRegistry(registry);
  ServiceLocator.registerSpawner(spawner);

  // Instantiate
  const timeSys = new TimeSystem();
  const inputSys = new InputSystem();
  const physicsSys = new PhysicsSystem();
  const lifeSys = new LifeCycleSystem();
  const behaviorSys = new BehaviorSystem();
  const collisionSys = new CollisionSystem();
  const combatSys = new CombatSystem();
  const waveSys = new WaveSystem();
  const playerSys = new PlayerSystem();
  const interactionSys = new InteractionSystem();
  const cameraSys = new CameraSystem();
  const gameSys = new GameStateSystem(); 
  const syncSys = new UISyncSystem(); 
  const panelSys = PanelRegistry; 
  const targetingSys = new TargetingSystem(); // NEW

  // Register
  const systems = {
      'TimeSystem': timeSys,
      'InputSystem': inputSys,
      'PhysicsSystem': physicsSys,
      'LifeCycleSystem': lifeSys,
      'BehaviorSystem': behaviorSys,
      'CollisionSystem': collisionSys,
      'CombatSystem': combatSys,
      'WaveSystem': waveSys,
      'PlayerSystem': playerSys,
      'InteractionSystem': interactionSys,
      'CameraSystem': cameraSys,
      'GameStateSystem': gameSys,
      'UISyncSystem': syncSys,
      'PanelRegistrySystem': panelSys,
      'TargetingSystem': targetingSys // NEW
  };

  Object.entries(systems).forEach(([key, sys]) => ServiceLocator.registerSystem(key, sys));
  
  // Update Loop Order
  engine.registerSystem(timeSys);
  engine.registerSystem(inputSys);
  engine.registerSystem(panelSys);
  engine.registerSystem(gameSys);
  engine.registerSystem(interactionSys); 
  engine.registerSystem(waveSys); 
  
  // AI Loop
  engine.registerSystem(targetingSys); // 1. Find Targets
  engine.registerSystem(playerSys); 
  engine.registerSystem(behaviorSys);  // 2. Move towards Targets
  
  // Physics Loop
  engine.registerSystem(physicsSys); 
  engine.registerSystem(collisionSys); // (Delegates to CombatSystem)

  engine.registerSystem(lifeSys); 
  engine.registerSystem(cameraSys); 
  engine.registerSystem(syncSys); 
  
  // Setup
  Object.values(systems).forEach(sys => sys.setup(ServiceLocator));
  
  engine.setup(ServiceLocator);

  spawner.spawnPlayer();

  return engine;
};
