import { RenderRegistry } from './RenderRegistry';

// Renderers
import { PlayerActor } from '@/ui/sim/actors/PlayerActor';
import { BulletActor } from '@/ui/sim/actors/BulletActor';
import { EnemyBulletActor } from '@/ui/sim/actors/EnemyBulletActor';
import { HunterChargeActor } from '@/ui/sim/actors/HunterChargeActor';
import { ParticleActor } from '@/ui/sim/actors/ParticleActor';
import { ProjectileTrailsActor } from '@/ui/sim/actors/ProjectileTrailsActor';
import { DaemonActor } from '@/ui/sim/actors/DaemonActor';
import { DaemonChargeActor } from '@/ui/sim/actors/DaemonChargeActor';
import { DaemonBulletActor } from '@/ui/sim/actors/DaemonBulletActor';

// New Atomic Renderers
import { DrillerActor } from '@/ui/sim/actors/DrillerActor';
import { KamikazeActor } from '@/ui/sim/actors/KamikazeActor';
import { HunterActor } from '@/ui/sim/actors/HunterActor';

export const registerAllRenderers = () => {
  // Core
  RenderRegistry.register(PlayerActor);
  RenderRegistry.register(ProjectileTrailsActor);
  
  // Projectiles
  RenderRegistry.register(BulletActor);
  RenderRegistry.register(EnemyBulletActor);
  RenderRegistry.register(DaemonBulletActor);
  
  // Enemies (Decoupled)
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
