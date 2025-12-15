import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class HealthData extends Component {
  readonly _type = ComponentType.Health;
  public current: number;

  constructor(public max: number, public invincibilityTime: number = 0) {
    super();
    this.current = max;
  }

  public reset(max: number, invincibilityTime: number = 0) {
    this.max = max;
    this.current = max;
    this.invincibilityTime = invincibilityTime;
    return this;
  }
}
