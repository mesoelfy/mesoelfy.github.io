import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class OrbitalData extends Component {
  readonly _type = ComponentType.Orbital;

  constructor(
    public parentId: number | null = null,
    public radius: number = 3.0,
    public speed: number = 2.0,
    public angle: number = 0,
    public active: boolean = true
  ) {
    super();
  }

  public reset(data: Partial<OrbitalData>) {
    this.parentId = data.parentId ?? null;
    this.radius = data.radius ?? 3.0;
    this.speed = data.speed ?? 2.0;
    this.angle = data.angle ?? 0;
    this.active = data.active ?? true;
    return this;
  }
}
