import { Component } from '../../core/ecs/Component';

export class MotionComponent extends Component {
  readonly _type = 'Motion';

  constructor(
    public vx: number = 0,
    public vy: number = 0,
    public friction: number = 0, // 0 = no friction, 1 = stop instantly
    public angularVelocity: number = 0
  ) {
    super();
  }
}
