import { Component } from '@/engine/ecs/Component';

export class LifetimeComponent extends Component {
  readonly _type = 'Lifetime';

  constructor(public remaining: number, public total: number) {
    super();
  }

  public reset(remaining: number, total: number) {
    this.remaining = remaining;
    this.total = total;
    return this;
  }
}
