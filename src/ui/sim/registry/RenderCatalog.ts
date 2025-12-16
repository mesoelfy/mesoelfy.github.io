import { RenderRegistry } from './RenderRegistry';

// Core Actors (Still specialized)
import { PlayerActor } from '../actors/PlayerActor';
import { ParticleActor } from '../actors/ParticleActor';
import { ProjectileRenderer } from '../actors/ProjectileRenderer';
import { DaemonActor } from '../actors/DaemonActor';

// The New Generic System
import { UniversalActor } from '../actors/UniversalActor';

export const registerAllRenderers = () => {
  // 1. Specialized Renderers
  RenderRegistry.register(PlayerActor);
  RenderRegistry.register(ParticleActor);
  RenderRegistry.register(ProjectileRenderer);
  RenderRegistry.register(DaemonActor); // Daemon is complex (shield/orbit), keeping specialized for now
  
  // 2. Generic Enemy Renderer
  // Replaces DrillerActor, KamikazeActor, HunterActor
  RenderRegistry.register(UniversalActor);
  
  console.log('[RenderCatalog] Visual Components Registered.');
};
