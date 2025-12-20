import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class AutoRotate extends Component {
  readonly _type = ComponentType.AutoRotate;

  constructor(public speed: number = 0) {
    super();
  }

  public reset(data: Partial<AutoRotate>) {
    this.speed = data.speed ?? 0;
    return this;
  }
}
