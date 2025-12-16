import { Component } from '@/core/ecs/Component';
import { ComponentType } from '@/core/ecs/ComponentType';

export class LifetimeData extends Component {
  readonly _type = ComponentType.Lifetime;

  constructor(public remaining: number, public total: number) {
    super();
  }

  public reset(remaining: number, total: number) {
    this.remaining = remaining;
    this.total = total;
    return this;
  }
}
