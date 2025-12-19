import { ComponentRegistry } from './ComponentRegistry';
import { ComponentType } from './ComponentType';

import { TransformData } from './components/TransformData';
import { MotionData } from './components/MotionData';
import { HealthData } from './components/HealthData';
import { IdentityData } from './components/IdentityData';
import { LifetimeData } from './components/LifetimeData';
import { CombatData } from './components/CombatData';
import { AIStateData } from './components/AIStateData';
import { ColliderData } from './components/ColliderData';
import { TargetData } from './components/TargetData';
import { OrbitalData } from './components/OrbitalData';
import { ProjectileData } from './components/ProjectileData';

// New Render Components
import { RenderModel } from './components/RenderModel';
import { RenderTransform } from './components/RenderTransform';
import { RenderEffect } from './components/RenderEffect';

export const registerAllComponents = () => {
  ComponentRegistry.register(ComponentType.Transform, TransformData);
  ComponentRegistry.register(ComponentType.Motion, MotionData);
  ComponentRegistry.register(ComponentType.Health, HealthData);
  ComponentRegistry.register(ComponentType.Identity, IdentityData);
  ComponentRegistry.register(ComponentType.Lifetime, LifetimeData);
  ComponentRegistry.register(ComponentType.Combat, CombatData);
  ComponentRegistry.register(ComponentType.State, AIStateData);
  ComponentRegistry.register(ComponentType.Collider, ColliderData);
  ComponentRegistry.register(ComponentType.Target, TargetData);
  ComponentRegistry.register(ComponentType.Orbital, OrbitalData);
  ComponentRegistry.register(ComponentType.Projectile, ProjectileData);
  
  // New
  ComponentRegistry.register(ComponentType.RenderModel, RenderModel);
  ComponentRegistry.register(ComponentType.RenderTransform, RenderTransform);
  ComponentRegistry.register(ComponentType.RenderEffect, RenderEffect);
  
  console.log('[ComponentCatalog] Components Registered.');
};
