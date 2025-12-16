import { IGameSystem } from '@/engine/interfaces';

import { TimeSystem } from '@/sys/systems/TimeSystem';
import { InputSystem } from '@/sys/systems/InputSystem';
import { PhysicsSystem } from '@/sys/systems/PhysicsSystem';
import { GameStateSystem } from '@/sys/systems/GameStateSystem';
import { UISyncSystem } from '@/sys/systems/UISyncSystem';
import { PanelRegistrySystem } from '@/sys/systems/PanelRegistrySystem';
import { AudioDirector } from '@/engine/audio/AudioDirector';

import { LifeCycleSystem } from '@/sys/systems/LifeCycleSystem';
import { BehaviorSystem } from '@/sys/systems/BehaviorSystem';
import { CollisionSystem } from '@/sys/systems/CollisionSystem';
import { CombatSystem } from '@/sys/systems/CombatSystem';
import { WaveSystem } from '@/sys/systems/WaveSystem';
import { PlayerSystem } from '@/sys/systems/PlayerSystem';
import { InteractionSystem } from '@/sys/systems/InteractionSystem';
import { StructureSystem } from '@/sys/systems/StructureSystem'; 
import { TargetingSystem } from '@/sys/systems/TargetingSystem';
import { GuidanceSystem } from '@/sys/systems/GuidanceSystem';
import { OrbitalSystem } from '@/sys/systems/OrbitalSystem';
import { RenderSystem } from '@/sys/systems/RenderSystem';
import { ProjectileSystem } from '@/sys/systems/ProjectileSystem';

import { ShakeSystem } from '@/sys/systems/ShakeSystem';
import { VFXSystem } from '@/sys/systems/VFXSystem';
import { ParticleSystem } from '@/sys/systems/ParticleSystem';

// New Systems
import { HealthSystem } from '@/sys/systems/HealthSystem';
import { ProgressionSystem } from '@/sys/systems/ProgressionSystem';

type SystemFactory = () => IGameSystem;

interface SystemDef {
  id: string;
  factory: SystemFactory;
}

const useClass = (ClassRef: new () => IGameSystem): SystemFactory => () => new ClassRef();

export const SYSTEM_MANIFEST: SystemDef[] = [
  // Core / Input
  { id: 'TimeSystem',       factory: useClass(TimeSystem) },
  { id: 'InputSystem',      factory: useClass(InputSystem) },
  { id: 'PanelRegistrySystem', factory: useClass(PanelRegistrySystem) },
  
  // Logic Core (Order Matters)
  { id: 'HealthSystem',     factory: useClass(HealthSystem) },
  { id: 'ProgressionSystem', factory: useClass(ProgressionSystem) },
  { id: 'GameStateSystem',  factory: useClass(GameStateSystem) }, // Depends on Health/Progression
  
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

  // Physics
  { id: 'PhysicsSystem',    factory: useClass(PhysicsSystem) },
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
