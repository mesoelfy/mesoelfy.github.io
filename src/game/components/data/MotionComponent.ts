import { Component } from '@/engine/ecs/Component';

export class MotionComponent extends Component {
  readonly _type = 'Motion';

  constructor(
    public vx: number = 0,
    public vy: number = 0,
    public friction: number = 0,
    public angularVelocity: number = 0
  ) {
    super();
  }

  public reset(vx: number = 0, vy: number = 0, friction: number = 0, angularVelocity: number = 0) {
    this.vx = vx;
    this.vy = vy;
    this.friction = friction;
    this.angularVelocity = angularVelocity;
    return this;
  }
}
