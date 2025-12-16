import { IGameSystem } from '@/core/interfaces';

// Core Systems
import { TimeSystem } from '@/core/systems/TimeSystem';
import { InputSystem } from '@/core/systems/InputSystem';
import { PhysicsSystem } from '@/core/systems/PhysicsSystem';
import { AudioDirector } from '@/core/audio/AudioDirector';

// Game Systems
import { GameStateSystem } from '@/game/systems/GameStateSystem';
import { UISyncSystem } from '@/game/systems/UISyncSystem';
import { PanelRegistrySystem } from '@/game/systems/PanelRegistrySystem';
import { LifeCycleSystem } from '@/game/systems/LifeCycleSystem';
import { BehaviorSystem } from '@/game/systems/BehaviorSystem';
import { CollisionSystem } from '@/game/systems/CollisionSystem';
import { CombatSystem } from '@/game/systems/CombatSystem';
import { WaveSystem } from '@/game/systems/WaveSystem';
import { PlayerSystem } from '@/game/systems/PlayerSystem';
import { InteractionSystem } from '@/game/systems/InteractionSystem';
import { StructureSystem } from '@/game/systems/StructureSystem'; 
import { TargetingSystem } from '@/game/systems/TargetingSystem';
import { GuidanceSystem } from '@/game/systems/GuidanceSystem';
import { OrbitalSystem } from '@/game/systems/OrbitalSystem';
import { RenderSystem } from '@/game/systems/RenderSystem';
import { ProjectileSystem } from '@/game/systems/ProjectileSystem';
import { ShakeSystem } from '@/game/systems/ShakeSystem';
import { VFXSystem } from '@/game/systems/VFXSystem';
import { ParticleSystem } from '@/game/systems/ParticleSystem';
import { HealthSystem } from '@/game/systems/HealthSystem';
import { ProgressionSystem } from '@/game/systems/ProgressionSystem';

type SystemFactory = () => IGameSystem;

interface SystemDef {
  id: string;
  factory: SystemFactory;
}

// Helper to create factory from Class
// Note: PhysicsSystem requires arguments now, so it shouldn't be in the generic manifest factory list
// We will handle core systems manually in GameBootstrapper
const useClass = (ClassRef: new () => IGameSystem): SystemFactory => () => new ClassRef();

export const SYSTEM_MANIFEST: SystemDef[] = [
  // Core / Input (Still included here for reference, but skipped by Bootstrapper)
  // { id: 'TimeSystem',       factory: useClass(TimeSystem) },
  // { id: 'InputSystem',      factory: useClass(InputSystem) },
  // { id: 'PhysicsSystem',    factory: useClass(PhysicsSystem) },
  
  { id: 'PanelRegistrySystem', factory: useClass(PanelRegistrySystem) },
  
  // Logic Core (Order Matters)
  { id: 'HealthSystem',     factory: useClass(HealthSystem) },
  { id: 'ProgressionSystem', factory: useClass(ProgressionSystem) },
  { id: 'GameStateSystem',  factory: useClass(GameStateSystem) }, 
  
  { id: 'InteractionSystem', factory: useClass(InteractionSystem) },
  { id: 'StructureSystem',  factory: useClass(StructureSystem) },
  { id: 'WaveSystem',       factory: useClass(WaveSystem) },

  { id: 'ParticleSystem',   factory: useClass(ParticleSystem) },

  // Entity Behavior
  { id: 'TargetingSystem',  factory: useClass(TargetingSystem) },
  { id: 'OrbitalSystem',    factory: useClass(OrbitalSystem) },
  { id: 'PlayerSystem',     factory: useClass(PlayerSystem) },
  { id: 'BehaviorSystem',   factory: useClass(BehaviorSystem) },
  { id: 'GuidanceSystem',   factory: useClass(GuidanceSystem) },

  // Physics & Collision
  { id: 'ProjectileSystem', factory: useClass(ProjectileSystem) },
  { id: 'CollisionSystem',  factory: useClass(CollisionSystem) },
  
  // Resolution
  { id: 'CombatSystem',     factory: useClass(CombatSystem) },
  { id: 'LifeCycleSystem',  factory: useClass(LifeCycleSystem) }, 
  
  // Visuals
  { id: 'RenderSystem',     factory: useClass(RenderSystem) },
  { id: 'VFXSystem',        factory: useClass(VFXSystem) },
  { id: 'AudioDirectorSystem', factory: useClass(AudioDirector) },
  { id: 'ShakeSystem',      factory: useClass(ShakeSystem) },
  { id: 'UISyncSystem',     factory: useClass(UISyncSystem) },
];
