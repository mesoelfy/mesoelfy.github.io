import { ComponentPoolManager } from './ecs/ComponentPoolManager';
import { TransformComponent } from '../components/data/TransformComponent';
import { MotionComponent } from '../components/data/MotionComponent';
import { HealthComponent } from '../components/data/HealthComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { LifetimeComponent } from '../components/data/LifetimeComponent';
import { CombatComponent } from '../components/data/CombatComponent';
import { StateComponent } from '../components/data/StateComponent';
import { ColliderComponent } from '../components/data/ColliderComponent';
import { TargetComponent } from '../components/data/TargetComponent';
import { OrbitalComponent } from '../components/data/OrbitalComponent';
import { Component } from './ecs/Component';

type ComponentFactory = (data: any) => Component;

// Helper to acquire or create
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
      () => new TransformComponent(data.x, data.y, data.rotation, data.scale),
      (c) => c.reset(data.x || 0, data.y || 0, data.rotation || 0, data.scale || 1)
  ),
  Motion: (data) => get('Motion',
      () => new MotionComponent(data.vx, data.vy, data.friction, data.angularVelocity),
      (c) => c.reset(data.vx || 0, data.vy || 0, data.friction || 0, data.angularVelocity || 0)
  ),
  Health: (data) => get('Health',
      () => new HealthComponent(data.max, data.invincibilityTime),
      (c) => c.reset(data.max, data.invincibilityTime || 0)
  ),
  Identity: (data) => get('Identity',
      () => new IdentityComponent(data.variant),
      (c) => c.reset(data.variant)
  ),
  Lifetime: (data) => get('Lifetime',
      () => new LifetimeComponent(data.remaining, data.total || data.remaining),
      (c) => c.reset(data.remaining, data.total || data.remaining)
  ),
  Combat: (data) => get('Combat',
      () => new CombatComponent(data.damage, data.cooldown, data.range),
      (c) => c.reset(data.damage, data.cooldown || 0, data.range || 0)
  ),
  State: (data) => get('State',
      () => new StateComponent(data.current, data.timers, data.data),
      (c) => c.reset(data.current, data.timers || {}, data.data || {})
  ),
  Collider: (data) => get('Collider',
      () => new ColliderComponent(data.radius, data.layer, data.mask),
      (c) => c.reset(data.radius, data.layer, data.mask)
  ),
  Target: (data) => get('Target',
      () => new TargetComponent(data.id, data.type, data.x, data.y, data.locked),
      (c) => c.reset(data.id, data.type, data.x, data.y, data.locked)
  ),
  Orbital: (data) => get('Orbital',
      () => new OrbitalComponent(data.parentId, data.radius, data.speed, data.angle, data.active),
      (c) => c.reset(data.parentId, data.radius, data.speed, data.angle, data.active)
  )
};
