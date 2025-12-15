import { RenderRegistry } from './RenderRegistry';

// Core Actors
import { PlayerActor } from '../actors/PlayerActor';
import { ParticleActor } from '../actors/ParticleActor';

// Unified 3D Renderer
import { ProjectileRenderer } from '../actors/ProjectileRenderer';

// Enemies
import { DrillerActor } from '../actors/DrillerActor';
import { KamikazeActor } from '../actors/KamikazeActor';
import { HunterActor } from '../actors/HunterActor';
import { DaemonActor } from '../actors/DaemonActor';

export const registerAllRenderers = () => {
  RenderRegistry.register(PlayerActor);
  RenderRegistry.register(ParticleActor);
  
  // The new 3D system
  RenderRegistry.register(ProjectileRenderer);
  
  RenderRegistry.register(DrillerActor);
  RenderRegistry.register(KamikazeActor);
  RenderRegistry.register(HunterActor);
  RenderRegistry.register(DaemonActor);
  
  console.log('[RenderCatalog] Visual Components Registered.');
};
