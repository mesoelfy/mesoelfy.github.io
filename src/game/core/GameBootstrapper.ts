import { ServiceLocator } from './ServiceLocator';
import { GameEngineCore } from './GameEngine';
import { EntityFactory } from './EntityFactory';

// Systems
import { TimeSystem } from '../systems/TimeSystem';
import { InputSystem } from '../systems/InputSystem';
import { EntitySystem } from '../systems/EntitySystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { PlayerSystem } from '../systems/PlayerSystem';
import { InteractionSystem } from '../systems/InteractionSystem';
import { CameraSystem } from '../systems/CameraSystem';
import { PanelRegistry } from '../systems/PanelRegistrySystem'; // Singleton
import { GameStateSystem } from '../systems/GameStateSystem'; // NEW
import { UISyncSystem } from '../systems/UISyncSystem'; // NEW

export const GameBootstrapper = () => {
  ServiceLocator.reset();

  const engine = new GameEngineCore();
  
  const timeSys = new TimeSystem();
  const inputSys = new InputSystem();
  const entitySys = new EntitySystem();
  const collisionSys = new CollisionSystem();
  const waveSys = new WaveSystem();
  const playerSys = new PlayerSystem();
  const interactionSys = new InteractionSystem();
  const cameraSys = new CameraSystem();
  const gameSys = new GameStateSystem(); // NEW
  const syncSys = new UISyncSystem(); // NEW
  
  const panelSys = PanelRegistry; 

  // Register
  ServiceLocator.registerSystem('TimeSystem', timeSys);
  ServiceLocator.registerSystem('InputSystem', inputSys);
  ServiceLocator.registerSystem('EntitySystem', entitySys);
  ServiceLocator.registerSystem('CollisionSystem', collisionSys);
  ServiceLocator.registerSystem('WaveSystem', waveSys);
  ServiceLocator.registerSystem('PlayerSystem', playerSys);
  ServiceLocator.registerSystem('InteractionSystem', interactionSys);
  ServiceLocator.registerSystem('CameraSystem', cameraSys);
  ServiceLocator.registerSystem('PanelRegistrySystem', panelSys);
  ServiceLocator.registerSystem('GameStateSystem', gameSys); // NEW
  ServiceLocator.registerSystem('UISyncSystem', syncSys); // NEW
  
  // Engine Loop
  engine.registerSystem(timeSys);
  engine.registerSystem(inputSys);
  engine.registerSystem(panelSys);
  engine.registerSystem(gameSys); // NEW (Logic Update)
  engine.registerSystem(interactionSys); 
  engine.registerSystem(waveSys); 
  engine.registerSystem(playerSys); 
  engine.registerSystem(entitySys); 
  engine.registerSystem(collisionSys); 
  engine.registerSystem(cameraSys); 
  engine.registerSystem(syncSys); // NEW (Last in loop to sync final state)
  
  // Setup
  timeSys.setup(ServiceLocator);
  inputSys.setup(ServiceLocator);
  gameSys.setup(ServiceLocator); // NEW
  entitySys.setup(ServiceLocator);
  collisionSys.setup(ServiceLocator);
  waveSys.setup(ServiceLocator);
  playerSys.setup(ServiceLocator);
  interactionSys.setup(ServiceLocator);
  cameraSys.setup(ServiceLocator);
  panelSys.setup(ServiceLocator);
  syncSys.setup(ServiceLocator); // NEW
  
  engine.setup(ServiceLocator);

  EntityFactory.createPlayer();

  return engine;
};
