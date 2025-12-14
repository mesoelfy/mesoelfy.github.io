import { Component } from '@/engine/ecs/Component';

export class HealthData extends Component {
  readonly _type = 'Health';
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
