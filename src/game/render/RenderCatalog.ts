import { RenderRegistry } from './RenderRegistry';

// Renderers
import { PlayerAvatar } from '../components/PlayerAvatar';
import { BulletRenderer } from '../components/BulletRenderer';
import { EnemyBulletRenderer } from '../components/EnemyBulletRenderer';
import { HunterChargeRenderer } from '../components/HunterChargeRenderer';
import { ParticleRenderer } from '../components/ParticleRenderer';
import { ProjectileTrails } from '../components/ProjectileTrails';
import { DaemonRenderer } from '../components/DaemonRenderer';
import { DaemonChargeRenderer } from '../components/DaemonChargeRenderer';
import { DaemonBulletRenderer } from '../components/DaemonBulletRenderer';

// New Atomic Renderers
import { DrillerRenderer } from '../components/enemies/DrillerRenderer';
import { KamikazeRenderer } from '../components/enemies/KamikazeRenderer';
import { HunterRenderer } from '../components/enemies/HunterRenderer';

export const registerAllRenderers = () => {
  // Core
  RenderRegistry.register(PlayerAvatar);
  RenderRegistry.register(ProjectileTrails);
  
  // Projectiles
  RenderRegistry.register(BulletRenderer);
  RenderRegistry.register(EnemyBulletRenderer);
  RenderRegistry.register(DaemonBulletRenderer);
  
  // Enemies (Decoupled)
  RenderRegistry.register(DrillerRenderer);
  RenderRegistry.register(KamikazeRenderer);
  RenderRegistry.register(HunterRenderer);
  
  // Friendlies
  RenderRegistry.register(DaemonRenderer);
  
  // FX / States
  RenderRegistry.register(ParticleRenderer);
  RenderRegistry.register(HunterChargeRenderer);
  RenderRegistry.register(DaemonChargeRenderer);
  
  console.log('[RenderCatalog] Visual Components Registered.');
};
