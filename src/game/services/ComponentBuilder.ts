import { ComponentRegistry } from '@/core/ecs/ComponentRegistry';
import { ComponentType } from '@/core/ecs/ComponentType';
import { TransformData } from '@/game/data/TransformData';
import { MotionData } from '@/game/data/MotionData';
import { HealthData } from '@/game/data/HealthData';
import { IdentityData } from '@/game/data/IdentityData';
import { LifetimeData } from '@/game/data/LifetimeData';
import { CombatData } from '@/game/data/CombatData';
import { AIStateData } from '@/game/data/AIStateData';
import { ColliderData } from '@/game/data/ColliderData';
import { TargetData } from '@/game/data/TargetData';
import { OrbitalData } from '@/game/data/OrbitalData';
import { RenderData } from '@/game/data/RenderData';
import { ProjectileData } from '@/game/data/ProjectileData';

// --- REGISTRATION ---
const reg = ComponentRegistry;

reg.register(ComponentType.Transform, 
    () => new TransformData(), 
    (c, d) => c.reset(d.x, d.y, d.rotation, d.scale)
);

reg.register(ComponentType.Motion, 
    () => new MotionData(), 
    (c, d) => c.reset(d.vx, d.vy, d.friction, d.angularVelocity)
);

reg.register(ComponentType.Health, 
    () => new HealthData(100), 
    (c, d) => c.reset(d.max, d.invincibilityTime)
);

reg.register(ComponentType.Identity, 
    () => new IdentityData(''), 
    (c, d) => c.reset(d.variant)
);

reg.register(ComponentType.Lifetime, 
    () => new LifetimeData(0, 0), 
    (c, d) => c.reset(d.remaining, d.total || d.remaining)
);

reg.register(ComponentType.Combat, 
    () => new CombatData(0), 
    (c, d) => c.reset(d.damage, d.cooldown, d.range)
);

reg.register(ComponentType.State, 
    () => new AIStateData(), 
    (c, d) => c.reset(d.current, d.timers, d.data)
);

reg.register(ComponentType.Collider, 
    () => new ColliderData(0, 0, 0), 
    (c, d) => c.reset(d.radius, d.layer, d.mask)
);

reg.register(ComponentType.Target, 
    () => new TargetData(), 
    (c, d) => c.reset(d.id, d.type, d.x, d.y, d.locked)
);

reg.register(ComponentType.Orbital, 
    () => new OrbitalData(), 
    (c, d) => c.reset(d.parentId, d.radius, d.speed, d.angle, d.active)
);

reg.register(ComponentType.Render, 
    () => new RenderData(), 
    (c, d) => c.reset(d.visualRotation, d.visualScale, d.r, d.g, d.b, d.opacity)
);

reg.register(ComponentType.Projectile, 
    () => new ProjectileData(), 
    (c, d) => c.reset(d.configId, d.state, d.ownerId)
);

// --- FACADE ---
// Export a Proxy that mimics the old { Type: Factory } object structure
// This allows EntitySpawner to remain unchanged for now.
export const ComponentBuilder = new Proxy({}, {
    get: (target, prop) => {
        return (data: any) => ComponentRegistry.build(prop as ComponentType, data || {});
    }
}) as Record<string, (data: any) => any>;
