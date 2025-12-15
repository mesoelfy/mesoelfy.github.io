import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class IdentityData extends Component {
  readonly _type = ComponentType.Identity;

  constructor(public variant: string) {
    super();
  }

  public reset(variant: string) {
    this.variant = variant;
    return this;
  }
}
