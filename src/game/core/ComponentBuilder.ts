import { TransformComponent } from '../components/data/TransformComponent';
import { MotionComponent } from '../components/data/MotionComponent';
import { HealthComponent } from '../components/data/HealthComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { LifetimeComponent } from '../components/data/LifetimeComponent';
import { CombatComponent } from '../components/data/CombatComponent';
import { StateComponent } from '../components/data/StateComponent';
import { ColliderComponent } from '../components/data/ColliderComponent';
import { Component } from './ecs/Component';

type ComponentFactory = (data: any) => Component;

export const ComponentBuilder: Record<string, ComponentFactory> = {
  Transform: (data) => new TransformComponent(data.x || 0, data.y || 0, data.rotation || 0, data.scale || 1),
  
  Motion: (data) => new MotionComponent(data.vx || 0, data.vy || 0, data.friction || 0, data.angularVelocity || 0),
  
  Health: (data) => new HealthComponent(data.max, data.invincibilityTime || 0),
  
  Identity: (data) => new IdentityComponent(data.variant),
  
  Lifetime: (data) => new LifetimeComponent(data.remaining, data.total || data.remaining),
  
  Combat: (data) => new CombatComponent(data.damage, data.cooldown || 0, data.range || 0),
  
  State: (data) => new StateComponent(data.current, data.timers || {}, data.data || {}),
  
  Collider: (data) => new ColliderComponent(data.radius, data.layer, data.mask)
};
