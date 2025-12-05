import { ServiceLocator } from './ServiceLocator';
import { GameEngineCore } from './GameEngine';

// Systems
import { TimeSystem } from '../systems/TimeSystem';
import { InputSystem } from '../systems/InputSystem';
import { EntitySystem } from '../systems/EntitySystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { PlayerSystem } from '../systems/PlayerSystem';
import { InteractionSystem } from '../systems/InteractionSystem';

export const GameBootstrapper = () => {
  // 1. Reset Locator
  ServiceLocator.reset();

  // 2. Instantiate Systems
  const engine = new GameEngineCore();
  const timeSys = new TimeSystem();
  const inputSys = new InputSystem();
  const entitySys = new EntitySystem();
  const collisionSys = new CollisionSystem();
  const waveSys = new WaveSystem();
  const playerSys = new PlayerSystem();
  const interactionSys = new InteractionSystem();

  // 3. Register to Locator
  ServiceLocator.registerSystem('TimeSystem', timeSys);
  ServiceLocator.registerSystem('InputSystem', inputSys);
  ServiceLocator.registerSystem('EntitySystem', entitySys);
  ServiceLocator.registerSystem('CollisionSystem', collisionSys);
  ServiceLocator.registerSystem('WaveSystem', waveSys);
  ServiceLocator.registerSystem('PlayerSystem', playerSys);
  ServiceLocator.registerSystem('InteractionSystem', interactionSys);
  
  // 4. Register to Engine Loop
  engine.registerSystem(timeSys);
  engine.registerSystem(inputSys);
  engine.registerSystem(interactionSys); // Run Interaction before physics? Or after? Before is fine.
  engine.registerSystem(waveSys); 
  engine.registerSystem(playerSys); 
  engine.registerSystem(entitySys); 
  engine.registerSystem(collisionSys); 
  
  // 5. Setup All
  timeSys.setup(ServiceLocator);
  inputSys.setup(ServiceLocator);
  entitySys.setup(ServiceLocator);
  collisionSys.setup(ServiceLocator);
  waveSys.setup(ServiceLocator);
  playerSys.setup(ServiceLocator);
  interactionSys.setup(ServiceLocator);
  
  engine.setup(ServiceLocator);

  return engine;
};
