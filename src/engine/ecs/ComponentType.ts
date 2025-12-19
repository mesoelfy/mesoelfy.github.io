export enum ComponentType {
  Transform = 'Transform',
  Motion = 'Motion',
  Health = 'Health',
  Identity = 'Identity',
  Lifetime = 'Lifetime',
  Combat = 'Combat',
  State = 'State',
  Collider = 'Collider',
  Target = 'Target',
  Orbital = 'Orbital',
  Projectile = 'Projectile',
  
  // New Render Composition
  RenderModel = 'RenderModel',         // Geometry, Material, Base Color
  RenderTransform = 'RenderTransform', // Visual Offsets, Base Scale
  RenderEffect = 'RenderEffect'        // Flash, Shudder, Spawn Progress
}
