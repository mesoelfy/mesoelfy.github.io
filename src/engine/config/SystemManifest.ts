import { IGameSystem } from '@/engine/interfaces';

// Core Systems
import { TimeSystem } from '@/engine/systems/TimeSystem';
import { InputSystem } from '@/engine/systems/InputSystem';
import { PhysicsSystem } from '@/engine/systems/PhysicsSystem';
import { AudioDirector } from '@/engine/audio/AudioDirector';

// Game Systems
import { GameStateSystem } from '@/engine/systems/GameStateSystem';
import { UISyncSystem } from '@/engine/systems/UISyncSystem';
import { PanelRegistrySystem } from '@/engine/systems/PanelRegistrySystem';
import { LifeCycleSystem } from '@/engine/systems/LifeCycleSystem';
import { BehaviorSystem } from '@/engine/systems/BehaviorSystem';
import { CollisionSystem } from '@/engine/systems/CollisionSystem';
import { CombatSystem } from '@/engine/systems/CombatSystem';
import { WaveSystem } from '@/engine/systems/WaveSystem';
import { PlayerSystem } from '@/engine/systems/PlayerSystem';
import { InteractionSystem } from '@/engine/systems/InteractionSystem';
import { StructureSystem } from '@/engine/systems/StructureSystem'; 
import { TargetingSystem } from '@/engine/systems/TargetingSystem';
import { GuidanceSystem } from '@/engine/systems/GuidanceSystem';
import { OrbitalSystem } from '@/engine/systems/OrbitalSystem';
import { RenderSystem } from '@/engine/systems/RenderSystem';
import { ProjectileSystem } from '@/engine/systems/ProjectileSystem';
import { ShakeSystem } from '@/engine/systems/ShakeSystem';
import { VFXSystem } from '@/engine/systems/VFXSystem';
import { ParticleSystem } from '@/engine/systems/ParticleSystem';
import { HealthSystem } from '@/engine/systems/HealthSystem';
import { ProgressionSystem } from '@/engine/systems/ProgressionSystem';

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
