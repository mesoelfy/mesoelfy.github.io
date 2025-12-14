import { Component } from '@/engine/ecs/Component';

export class ColliderData extends Component {
  readonly _type = 'Collider';

  constructor(
    public radius: number,
    public layer: number,
    public mask: number
  ) {
    super();
  }

  public reset(radius: number, layer: number, mask: number) {
    this.radius = radius;
    this.layer = layer;
    this.mask = mask;
    return this;
  }
}
