import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class RenderTransform extends Component {
  readonly _type = ComponentType.RenderTransform;

  constructor(
    public offsetX: number = 0,
    public offsetY: number = 0,
    public offsetZ: number = 0,
    public rotation: number = 0,
    public scale: number = 1.0,
    // Intrinsic Aspect Ratio (crucial for projectiles)
    public baseScaleX: number = 1.0,
    public baseScaleY: number = 1.0,
    public baseScaleZ: number = 1.0
  ) {
    super();
  }

  public reset(data: Partial<RenderTransform>) {
    this.offsetX = data.offsetX ?? 0;
    this.offsetY = data.offsetY ?? 0;
    this.offsetZ = data.offsetZ ?? 0;
    this.rotation = data.rotation ?? 0;
    this.scale = data.scale ?? 1.0;
    this.baseScaleX = data.baseScaleX ?? 1.0;
    this.baseScaleY = data.baseScaleY ?? 1.0;
    this.baseScaleZ = data.baseScaleZ ?? 1.0;
    return this;
  }
}
