import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class LifetimeData extends Component {
  readonly _type = ComponentType.Lifetime;

  constructor(public remaining: number = 0, public total: number = 0) {
    super();
  }

  public reset(data: Partial<LifetimeData>) {
    this.remaining = data.remaining ?? 0;
    this.total = data.total ?? this.remaining;
    return this;
  }
}
