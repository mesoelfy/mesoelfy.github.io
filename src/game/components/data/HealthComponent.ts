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

  public get isDead(): boolean {
    return this.current <= 0;
  }

  public damage(amount: number) {
    // Invincibility handling will happen in Systems, this is just data
    this.current = Math.max(0, this.current - amount);
  }
  
  public heal(amount: number) {
      this.current = Math.min(this.max, this.current + amount);
  }
}
