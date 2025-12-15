import { RenderRegistry } from './RenderRegistry';

// Core Actors
import { PlayerActor } from '../actors/PlayerActor';
import { ParticleActor } from '../actors/ParticleActor';

// New Unified Renderer
import { OrdnanceRenderer } from '../actors/OrdnanceRenderer';

// Enemies
import { DrillerActor } from '../actors/DrillerActor';
import { KamikazeActor } from '../actors/KamikazeActor';
import { HunterActor } from '../actors/HunterActor';
import { DaemonActor } from '../actors/DaemonActor';

export const registerAllRenderers = () => {
  // Core
  RenderRegistry.register(PlayerActor);
  RenderRegistry.register(ParticleActor);
  
  // Projectiles & Charging FX
  RenderRegistry.register(OrdnanceRenderer);
  
  // Enemies
  RenderRegistry.register(DrillerActor);
  RenderRegistry.register(KamikazeActor);
  RenderRegistry.register(HunterActor);
  
  // Friendlies
  RenderRegistry.register(DaemonActor);
  
  console.log('[RenderCatalog] Visual Components Registered.');
};
