import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class ColliderData extends Component {
  readonly _type = ComponentType.Collider;

  constructor(
    public radius: number = 0,
    public layer: number = 0,
    public mask: number = 0
  ) {
    super();
  }

  public reset(data: Partial<ColliderData>) {
    this.radius = data.radius ?? 0;
    this.layer = data.layer ?? 0;
    this.mask = data.mask ?? 0;
    return this;
  }
}
