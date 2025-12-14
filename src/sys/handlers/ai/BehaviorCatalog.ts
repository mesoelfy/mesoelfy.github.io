import { AIRegistry } from './AIRegistry';
import { EnemyTypes } from '@/sys/config/Identifiers';

// Logic Implementations
import { DrillerLogic } from './DrillerLogic';
import { KamikazeLogic } from './KamikazeLogic';
import { HunterLogic } from './HunterLogic';
import { DaemonLogic } from './DaemonLogic';

export const registerAllBehaviors = () => {
  AIRegistry.register(EnemyTypes.DRILLER, DrillerLogic);
  AIRegistry.register(EnemyTypes.KAMIKAZE, KamikazeLogic);
  AIRegistry.register(EnemyTypes.HUNTER, HunterLogic);
  AIRegistry.register(EnemyTypes.DAEMON, DaemonLogic);
  
  console.log('[BehaviorCatalog] AI Behaviors Registered.');
};
