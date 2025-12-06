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
import { CameraSystem } from '../systems/CameraSystem'; // NEW

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
  const cameraSys = new CameraSystem(); // NEW

  // Register
  ServiceLocator.registerSystem('TimeSystem', timeSys);
  ServiceLocator.registerSystem('InputSystem', inputSys);
  ServiceLocator.registerSystem('EntitySystem', entitySys);
  ServiceLocator.registerSystem('CollisionSystem', collisionSys);
  ServiceLocator.registerSystem('WaveSystem', waveSys);
  ServiceLocator.registerSystem('PlayerSystem', playerSys);
  ServiceLocator.registerSystem('InteractionSystem', interactionSys);
  ServiceLocator.registerSystem('CameraSystem', cameraSys); // NEW
  
  // Engine Loop
  engine.registerSystem(timeSys);
  engine.registerSystem(inputSys);
  engine.registerSystem(interactionSys); 
  engine.registerSystem(waveSys); 
  engine.registerSystem(playerSys); 
  engine.registerSystem(entitySys); 
  engine.registerSystem(collisionSys); 
  engine.registerSystem(cameraSys); // NEW (Order doesn't matter much for camera logic)
  
  // Setup
  timeSys.setup(ServiceLocator);
  inputSys.setup(ServiceLocator);
  entitySys.setup(ServiceLocator);
  collisionSys.setup(ServiceLocator);
  waveSys.setup(ServiceLocator);
  playerSys.setup(ServiceLocator);
  interactionSys.setup(ServiceLocator);
  cameraSys.setup(ServiceLocator); // NEW
  
  engine.setup(ServiceLocator);

  EntityFactory.createPlayer();

  return engine;
};
