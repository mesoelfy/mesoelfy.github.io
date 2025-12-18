import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class IdentityData extends Component {
  readonly _type = ComponentType.Identity;

  constructor(public variant: string = '') {
    super();
  }

  public reset(data: Partial<IdentityData>) {
    this.variant = data.variant ?? '';
    return this;
  }
}
