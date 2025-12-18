import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export type ColliderShape = 'CIRCLE' | 'BOX';

export class ColliderData extends Component {
  readonly _type = ComponentType.Collider;

  constructor(
    public shape: ColliderShape = 'CIRCLE',
    public radius: number = 0,
    public width: number = 0,
    public height: number = 0,
    public layer: number = 0,
    public mask: number = 0
  ) {
    super();
  }

  public reset(data: Partial<ColliderData>) {
    this.shape = data.shape ?? 'CIRCLE';
    this.radius = data.radius ?? 0;
    this.width = data.width ?? 0;
    this.height = data.height ?? 0;
    this.layer = data.layer ?? 0;
    this.mask = data.mask ?? 0;
    return this;
  }
}
