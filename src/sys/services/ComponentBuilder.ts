import { ComponentPoolManager } from '@/engine/ecs/ComponentPoolManager';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { TransformData } from '@/sys/data/TransformData';
import { MotionData } from '@/sys/data/MotionData';
import { HealthData } from '@/sys/data/HealthData';
import { IdentityData } from '@/sys/data/IdentityData';
import { LifetimeData } from '@/sys/data/LifetimeData';
import { CombatData } from '@/sys/data/CombatData';
import { AIStateData } from '@/sys/data/AIStateData';
import { ColliderData } from '@/sys/data/ColliderData';
import { TargetData } from '@/sys/data/TargetData';
import { OrbitalData } from '@/sys/data/OrbitalData';
import { RenderData } from '@/sys/data/RenderData';
import { OrdnanceData } from '@/sys/data/OrdnanceData';
import { Component } from '@/engine/ecs/Component';

type ComponentFactory = (data: any) => Component;

const get = <T extends Component>(type: ComponentType, factory: () => T, reset: (c: T) => void): T => {
    const pooled = ComponentPoolManager.acquire<T>(type);
    if (pooled) {
        reset(pooled);
        return pooled;
    }
    return factory();
};

export const ComponentBuilder: Record<string, ComponentFactory> = {
  [ComponentType.Transform]: (data) => get(ComponentType.Transform, 
      () => new TransformData(data.x, data.y, data.rotation, data.scale),
      (c) => c.reset(data.x || 0, data.y || 0, data.rotation || 0, data.scale || 1)
  ),
  [ComponentType.Motion]: (data) => get(ComponentType.Motion,
      () => new MotionData(data.vx, data.vy, data.friction, data.angularVelocity),
      (c) => c.reset(data.vx || 0, data.vy || 0, data.friction || 0, data.angularVelocity || 0)
  ),
  [ComponentType.Health]: (data) => get(ComponentType.Health,
      () => new HealthData(data.max, data.invincibilityTime),
      (c) => c.reset(data.max, data.invincibilityTime || 0)
  ),
  [ComponentType.Identity]: (data) => get(ComponentType.Identity,
      () => new IdentityData(data.variant),
      (c) => c.reset(data.variant)
  ),
  [ComponentType.Lifetime]: (data) => get(ComponentType.Lifetime,
      () => new LifetimeData(data.remaining, data.total || data.remaining),
      (c) => c.reset(data.remaining, data.total || data.remaining)
  ),
  [ComponentType.Combat]: (data) => get(ComponentType.Combat,
      () => new CombatData(data.damage, data.cooldown, data.range),
      (c) => c.reset(data.damage, data.cooldown || 0, data.range || 0)
  ),
  [ComponentType.State]: (data) => get(ComponentType.State,
      () => new AIStateData(data.current, data.timers, data.data),
      (c) => c.reset(data.current, data.timers || {}, data.data || {})
  ),
  [ComponentType.Collider]: (data) => get(ComponentType.Collider,
      () => new ColliderData(data.radius, data.layer, data.mask),
      (c) => c.reset(data.radius, data.layer, data.mask)
  ),
  [ComponentType.Target]: (data) => get(ComponentType.Target,
      () => new TargetData(data.id, data.type, data.x, data.y, data.locked),
      (c) => c.reset(data.id, data.type, data.x, data.y, data.locked)
  ),
  [ComponentType.Orbital]: (data) => get(ComponentType.Orbital,
      () => new OrbitalData(data.parentId, data.radius, data.speed, data.angle, data.active),
      (c) => c.reset(data.parentId, data.radius, data.speed, data.angle, data.active)
  ),
  [ComponentType.Render]: (data) => get(ComponentType.Render,
      () => new RenderData(data.visualRotation, data.visualScale, data.r, data.g, data.b, data.opacity),
      (c) => c.reset(data.visualRotation || 0, data.visualScale || 1.0, data.r ?? 1, data.g ?? 1, data.b ?? 1, data.opacity ?? 1.0)
  ),
  [ComponentType.Ordnance]: (data) => get(ComponentType.Ordnance,
      () => new OrdnanceData(data.type, data.state, data.ownerId, data.glowIntensity),
      (c) => c.reset(data.type || 'PLASMA', data.state || 'FLIGHT', data.ownerId || -1, data.glowIntensity || 1.0)
  )
};
