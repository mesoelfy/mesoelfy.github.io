import { RenderRegistry } from './RenderRegistry';

// Core Actors
import { PlayerActor } from '../actors/PlayerActor';
import { ProjectileTrailsActor } from '../actors/ProjectileTrailsActor';
import { ParticleActor } from '../actors/ParticleActor';

// Generic Renderers
import { BallisticsRenderer } from '../actors/BallisticsRenderer'; // NEW

// Enemies
import { DrillerActor } from '../actors/DrillerActor';
import { KamikazeActor } from '../actors/KamikazeActor';
import { HunterActor } from '../actors/HunterActor';
import { DaemonActor } from '../actors/DaemonActor';

// Special States
import { HunterChargeActor } from '../actors/HunterChargeActor';
import { DaemonChargeActor } from '../actors/DaemonChargeActor';

export const registerAllRenderers = () => {
  // Core
  RenderRegistry.register(PlayerActor);
  RenderRegistry.register(ProjectileTrailsActor);
  RenderRegistry.register(ParticleActor);
  
  // Bullets (Consolidated)
  RenderRegistry.register(BallisticsRenderer);
  
  // Enemies
  RenderRegistry.register(DrillerActor);
  RenderRegistry.register(KamikazeActor);
  RenderRegistry.register(HunterActor);
  
  // Friendlies
  RenderRegistry.register(DaemonActor);
  
  // Special FX States
  // Note: HunterChargeActor handles the "Charging" ball. 
  // Once fired, it becomes a generic BULLET entity handled by BallisticsRenderer.
  RenderRegistry.register(HunterChargeActor);
  RenderRegistry.register(DaemonChargeActor);
  
  console.log('[RenderCatalog] Visual Components Registered.');
};
