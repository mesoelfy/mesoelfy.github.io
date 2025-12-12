import { IGameSystem } from '../core/interfaces';

// Core Systems
import { TimeSystem } from '../systems/TimeSystem';
import { InputSystem } from '../systems/InputSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { GameStateSystem } from '../systems/GameStateSystem';
import { UISyncSystem } from '../systems/UISyncSystem';
import { PanelRegistry } from '../systems/PanelRegistrySystem';
import { AudioDirectorSystem } from '../systems/AudioDirectorSystem'; // NEW

// Gameplay Systems
import { LifeCycleSystem } from '../systems/LifeCycleSystem';
import { BehaviorSystem } from '../systems/BehaviorSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { PlayerSystem } from '../systems/PlayerSystem';
import { InteractionSystem } from '../systems/InteractionSystem';
import { TargetingSystem } from '../systems/TargetingSystem';
import { GuidanceSystem } from '../systems/GuidanceSystem';
import { OrbitalSystem } from '../systems/OrbitalSystem';

// VFX
import { ShakeSystem } from '../systems/ShakeSystem';
import { VFXSystem } from '../systems/VFXSystem';

type SystemFactory = () => IGameSystem;

interface SystemDef {
  id: string;
  factory: SystemFactory;
}

// HELPER: Wraps a class constructor
const useClass = (ClassRef: new () => IGameSystem): SystemFactory => () => new ClassRef();

// HELPER: Wraps an existing singleton instance
const useInstance = (instance: IGameSystem): SystemFactory => () => instance;

/**
 * THE SYSTEM PIPELINE
 */
export const SYSTEM_MANIFEST: SystemDef[] = [
  // --- 1. CORE & INPUT (Prepare the frame) ---
  { id: 'TimeSystem',       factory: useClass(TimeSystem) },
  { id: 'InputSystem',      factory: useClass(InputSystem) },
  { id: 'PanelRegistrySystem', factory: useInstance(PanelRegistry) }, // Singleton
  { id: 'GameStateSystem',  factory: useClass(GameStateSystem) },
  { id: 'InteractionSystem', factory: useClass(InteractionSystem) },
  { id: 'WaveSystem',       factory: useClass(WaveSystem) },

  // --- 2. AI & DECISION MAKING (Think) ---
  { id: 'TargetingSystem',  factory: useClass(TargetingSystem) },
  { id: 'OrbitalSystem',    factory: useClass(OrbitalSystem) },
  { id: 'PlayerSystem',     factory: useClass(PlayerSystem) },
  { id: 'BehaviorSystem',   factory: useClass(BehaviorSystem) }, // AI Logic
  { id: 'GuidanceSystem',   factory: useClass(GuidanceSystem) },

  // --- 3. PHYSICS & RESOLUTION (Move & Hit) ---
  { id: 'PhysicsSystem',    factory: useClass(PhysicsSystem) },
  { id: 'CollisionSystem',  factory: useClass(CollisionSystem) },
  
  // --- 4. OUTCOMES (Die & Explode) ---
  { id: 'CombatSystem',     factory: useClass(CombatSystem) }, // Resolves damage logic
  { id: 'LifeCycleSystem',  factory: useClass(LifeCycleSystem) }, 
  { id: 'VFXSystem',        factory: useClass(VFXSystem) },
  { id: 'AudioDirectorSystem', factory: useClass(AudioDirectorSystem) }, // NEW
  
  // --- 5. RENDER PREP (Sync to View) ---
  { id: 'ShakeSystem',      factory: useClass(ShakeSystem) },
  { id: 'UISyncSystem',     factory: useClass(UISyncSystem) },
];
