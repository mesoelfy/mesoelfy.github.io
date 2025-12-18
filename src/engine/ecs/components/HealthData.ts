import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class HealthData extends Component {
  readonly _type = ComponentType.Health;
  public current: number;

  constructor(public max: number = 100, public invincibilityTime: number = 0) {
    super();
    this.current = max;
  }

  public reset(data: Partial<HealthData>) {
    this.max = data.max ?? 100;
    this.current = this.max;
    this.invincibilityTime = data.invincibilityTime ?? 0;
    return this;
  }
}
