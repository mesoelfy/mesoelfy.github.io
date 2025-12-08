import { ServiceLocator } from './ServiceLocator';
import { GameEngineCore } from './GameEngine';
import { EntityRegistry } from './ecs/EntityRegistry';
import { EntitySpawner } from './EntitySpawner';

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
import { ShakeSystem } from '../systems/ShakeSystem'; // REPLACES CameraSystem
import { PanelRegistry } from '../systems/PanelRegistrySystem'; 
import { GameStateSystem } from '../systems/GameStateSystem'; 
import { UISyncSystem } from '../systems/UISyncSystem'; 
import { TargetingSystem } from '../systems/TargetingSystem'; 

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
  const shakeSys = new ShakeSystem(); // NEW
  const gameSys = new GameStateSystem(); 
  const syncSys = new UISyncSystem(); 
  const panelSys = PanelRegistry; 
  const targetingSys = new TargetingSystem(); 

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
      'ShakeSystem': shakeSys, // NEW
      'GameStateSystem': gameSys,
      'UISyncSystem': syncSys,
      'PanelRegistrySystem': panelSys,
      'TargetingSystem': targetingSys
  };

  Object.entries(systems).forEach(([key, sys]) => ServiceLocator.registerSystem(key, sys));
  
  // Update Loop
  engine.registerSystem(timeSys);
  engine.registerSystem(inputSys);
  engine.registerSystem(panelSys);
  engine.registerSystem(gameSys);
  engine.registerSystem(interactionSys); 
  engine.registerSystem(waveSys); 
  engine.registerSystem(targetingSys); 
  engine.registerSystem(playerSys); 
  engine.registerSystem(behaviorSys); 
  engine.registerSystem(physicsSys); 
  engine.registerSystem(collisionSys); 
  engine.registerSystem(lifeSys); 
  engine.registerSystem(shakeSys); // Run near end to calc final offsets
  engine.registerSystem(syncSys); 
  
  // Setup
  Object.values(systems).forEach(sys => sys.setup(ServiceLocator));
  
  engine.setup(ServiceLocator);

  spawner.spawnPlayer();

  return engine;
};
