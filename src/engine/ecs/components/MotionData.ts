import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class MotionData extends Component {
  readonly _type = ComponentType.Motion;

  constructor(
    public vx: number = 0,
    public vy: number = 0,
    public friction: number = 0,
    public angularVelocity: number = 0
  ) {
    super();
  }

  public reset(data: Partial<MotionData>) {
    this.vx = data.vx ?? 0;
    this.vy = data.vy ?? 0;
    this.friction = data.friction ?? 0;
    this.angularVelocity = data.angularVelocity ?? 0;
    return this;
  }
}
