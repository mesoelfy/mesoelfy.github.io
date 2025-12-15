import { ComponentPoolManager } from '@/engine/ecs/ComponentPoolManager';
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
import { Component } from '@/engine/ecs/Component';

type ComponentFactory = (data: any) => Component;

const get = <T extends Component>(type: string, factory: () => T, reset: (c: T) => void): T => {
    const pooled = ComponentPoolManager.acquire<T>(type);
    if (pooled) {
        reset(pooled);
        return pooled;
    }
    return factory();
};

export const ComponentBuilder: Record<string, ComponentFactory> = {
  Transform: (data) => get('Transform', 
      () => new TransformData(data.x, data.y, data.rotation, data.scale),
      (c) => c.reset(data.x || 0, data.y || 0, data.rotation || 0, data.scale || 1)
  ),
  Motion: (data) => get('Motion',
      () => new MotionData(data.vx, data.vy, data.friction, data.angularVelocity),
      (c) => c.reset(data.vx || 0, data.vy || 0, data.friction || 0, data.angularVelocity || 0)
  ),
  Health: (data) => get('Health',
      () => new HealthData(data.max, data.invincibilityTime),
      (c) => c.reset(data.max, data.invincibilityTime || 0)
  ),
  Identity: (data) => get('Identity',
      () => new IdentityData(data.variant),
      (c) => c.reset(data.variant)
  ),
  Lifetime: (data) => get('Lifetime',
      () => new LifetimeData(data.remaining, data.total || data.remaining),
      (c) => c.reset(data.remaining, data.total || data.remaining)
  ),
  Combat: (data) => get('Combat',
      () => new CombatData(data.damage, data.cooldown, data.range),
      (c) => c.reset(data.damage, data.cooldown || 0, data.range || 0)
  ),
  State: (data) => get('State',
      () => new AIStateData(data.current, data.timers, data.data),
      (c) => c.reset(data.current, data.timers || {}, data.data || {})
  ),
  Collider: (data) => get('Collider',
      () => new ColliderData(data.radius, data.layer, data.mask),
      (c) => c.reset(data.radius, data.layer, data.mask)
  ),
  Target: (data) => get('Target',
      () => new TargetData(data.id, data.type, data.x, data.y, data.locked),
      (c) => c.reset(data.id, data.type, data.x, data.y, data.locked)
  ),
  Orbital: (data) => get('Orbital',
      () => new OrbitalData(data.parentId, data.radius, data.speed, data.angle, data.active),
      (c) => c.reset(data.parentId, data.radius, data.speed, data.angle, data.active)
  )
};
