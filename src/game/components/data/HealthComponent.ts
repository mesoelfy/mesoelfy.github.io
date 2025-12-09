import { Component } from '../../core/ecs/Component';

export class HealthComponent extends Component {
  readonly _type = 'Health';

  public current: number;

  constructor(
    public max: number,
    public invincibilityTime: number = 0
  ) {
    super();
    this.current = max;
  }
}
