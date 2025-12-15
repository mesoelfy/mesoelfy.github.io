import { RenderRegistry } from './RenderRegistry';

// Actors
import { PlayerActor } from '../actors/PlayerActor';
import { BulletActor } from '../actors/BulletActor';
import { EnemyBulletActor } from '../actors/EnemyBulletActor';
import { HunterChargeActor } from '../actors/HunterChargeActor';
import { ParticleActor } from '../actors/ParticleActor';
import { ProjectileTrailsActor } from '../actors/ProjectileTrailsActor';
import { DaemonActor } from '../actors/DaemonActor';
import { DaemonChargeActor } from '../actors/DaemonChargeActor';
import { DaemonBulletActor } from '../actors/DaemonBulletActor';

import { DrillerActor } from '../actors/DrillerActor';
import { KamikazeActor } from '../actors/KamikazeActor';
import { HunterActor } from '../actors/HunterActor';

export const registerAllRenderers = () => {
  // Core
  RenderRegistry.register(PlayerActor);
  RenderRegistry.register(ProjectileTrailsActor);
  
  // Projectiles
  RenderRegistry.register(BulletActor);
  RenderRegistry.register(EnemyBulletActor);
  RenderRegistry.register(DaemonBulletActor);
  
  // Enemies
  RenderRegistry.register(DrillerActor);
  RenderRegistry.register(KamikazeActor);
  RenderRegistry.register(HunterActor);
  
  // Friendlies
  RenderRegistry.register(DaemonActor);
  
  // FX / States
  RenderRegistry.register(ParticleActor);
  RenderRegistry.register(HunterChargeActor);
  RenderRegistry.register(DaemonChargeActor);
  
  console.log('[RenderCatalog] Visual Components Registered.');
};
