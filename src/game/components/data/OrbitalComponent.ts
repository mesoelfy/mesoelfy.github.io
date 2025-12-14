import { Component } from '@/engine/ecs/Component';

export class OrbitalComponent extends Component {
  readonly _type = 'Orbital';

  constructor(
    public parentId: number | null = null,
    public radius: number = 3.0,
    public speed: number = 2.0,
    public angle: number = 0,
    public active: boolean = true
  ) {
    super();
  }

  public reset(parentId: number | null = null, radius: number = 3.0, speed: number = 2.0, angle: number = 0, active: boolean = true) {
    this.parentId = parentId;
    this.radius = radius;
    this.speed = speed;
    this.angle = angle;
    this.active = active;
    return this;
  }
}
