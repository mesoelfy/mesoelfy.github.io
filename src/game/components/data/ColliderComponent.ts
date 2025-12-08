import { Component } from '../../core/ecs/Component';

export class ColliderComponent extends Component {
  readonly _type = 'Collider';

  constructor(
    public radius: number,
    public layer: number,
    public mask: number
  ) {
    super();
  }
}
