import { Component } from '../../core/ecs/Component';

export class TransformComponent extends Component {
  readonly _type = 'Transform';

  constructor(
    public x: number = 0,
    public y: number = 0,
    public rotation: number = 0,
    public scale: number = 1
  ) {
    super();
  }
}
