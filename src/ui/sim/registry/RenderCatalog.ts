import { RenderRegistry } from './RenderRegistry';

// Core Actors (Still specialized)
import { PlayerActor } from '../actors/PlayerActor';
import { ParticleActor } from '../actors/ParticleActor';
import { ProjectileRenderer } from '../actors/ProjectileRenderer';
import { DaemonActor } from '../actors/DaemonActor';

// The New Generic System
import { UniversalActor } from '../actors/UniversalActor';

export const registerAllRenderers = () => {
  // 1. Opaque / Depth-Writing Geometry (Draw First)
  RenderRegistry.register(UniversalActor); // Enemies
  RenderRegistry.register(DaemonActor); 
  
  // 2. Transparent / Additive Geometry (Draw Last)
  RenderRegistry.register(PlayerActor);
  RenderRegistry.register(ProjectileRenderer);
  
  // Particles must be absolutely last to composite correctly over everything
  RenderRegistry.register(ParticleActor);
  
  console.log('[RenderCatalog] Visual Components Registered.');
};
