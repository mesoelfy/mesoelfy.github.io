import { IGameSystem } from '../core/interfaces';

// Core Systems
import { TimeSystem } from '../systems/TimeSystem';
import { InputSystem } from '../systems/InputSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { GameStateSystem } from '../systems/GameStateSystem';
import { UISyncSystem } from '../systems/UISyncSystem';
import { PanelRegistry } from '../systems/PanelRegistrySystem';
import { AudioDirectorSystem } from '../systems/AudioDirectorSystem';

// Gameplay Systems
import { LifeCycleSystem } from '../systems/LifeCycleSystem';
import { BehaviorSystem } from '../systems/BehaviorSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { PlayerSystem } from '../systems/PlayerSystem';
import { InteractionSystem } from '../systems/InteractionSystem';
import { StructureSystem } from '../systems/StructureSystem'; 
import { TargetingSystem } from '../systems/TargetingSystem';
import { GuidanceSystem } from '../systems/GuidanceSystem';
import { OrbitalSystem } from '../systems/OrbitalSystem';

// VFX
import { ShakeSystem } from '../systems/ShakeSystem';
import { VFXSystem } from '../systems/VFXSystem';
import { ParticleSystem } from '../systems/ParticleSystem';

type SystemFactory = () => IGameSystem;

interface SystemDef {
  id: string;
  factory: SystemFactory;
}

const useClass = (ClassRef: new () => IGameSystem): SystemFactory => () => new ClassRef();
const useInstance = (instance: IGameSystem): SystemFactory => () => instance;

export const SYSTEM_MANIFEST: SystemDef[] = [
  { id: 'TimeSystem',       factory: useClass(TimeSystem) },
  { id: 'InputSystem',      factory: useClass(InputSystem) },
  { id: 'PanelRegistrySystem', factory: useInstance(PanelRegistry) },
  { id: 'GameStateSystem',  factory: useClass(GameStateSystem) },
  { id: 'InteractionSystem', factory: useClass(InteractionSystem) },
  { id: 'StructureSystem',  factory: useClass(StructureSystem) },
  { id: 'WaveSystem',       factory: useClass(WaveSystem) },

  { id: 'ParticleSystem',   factory: useClass(ParticleSystem) }, // NEW

  { id: 'TargetingSystem',  factory: useClass(TargetingSystem) },
  { id: 'OrbitalSystem',    factory: useClass(OrbitalSystem) },
  { id: 'PlayerSystem',     factory: useClass(PlayerSystem) },
  { id: 'BehaviorSystem',   factory: useClass(BehaviorSystem) },
  { id: 'GuidanceSystem',   factory: useClass(GuidanceSystem) },

  { id: 'PhysicsSystem',    factory: useClass(PhysicsSystem) },
  { id: 'CollisionSystem',  factory: useClass(CollisionSystem) },
  
  { id: 'CombatSystem',     factory: useClass(CombatSystem) },
  { id: 'LifeCycleSystem',  factory: useClass(LifeCycleSystem) }, 
  { id: 'VFXSystem',        factory: useClass(VFXSystem) },
  { id: 'AudioDirectorSystem', factory: useClass(AudioDirectorSystem) },
  
  { id: 'ShakeSystem',      factory: useClass(ShakeSystem) },
  { id: 'UISyncSystem',     factory: useClass(UISyncSystem) },
];
