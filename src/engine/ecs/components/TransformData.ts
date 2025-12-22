import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class TransformData extends Component {
  readonly _type = ComponentType.Transform;

  constructor(
    public x: number = 0, 
    public y: number = 0, 
    public rotation: number = 0, 
    public scale: number = 1.0,
    
    // Previous state for interpolation
    public prevX: number = 0,
    public prevY: number = 0,
    public prevRotation: number = 0,
    public prevScale: number = 1.0
  ) {
    super();
  }

  public reset(data: Partial<{ x: number, y: number, rotation: number, scale: number }>) {
    this.x = data.x ?? 0;
    this.y = data.y ?? 0;
    this.rotation = data.rotation ?? 0;
    this.scale = data.scale ?? 1.0;
    
    // Reset previous to current to prevent jump on spawn
    this.prevX = this.x;
    this.prevY = this.y;
    this.prevRotation = this.rotation;
    this.prevScale = this.scale;
    
    return this;
  }
}
