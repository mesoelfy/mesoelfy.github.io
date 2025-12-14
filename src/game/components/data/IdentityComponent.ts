import { Component } from '@/engine/ecs/Component';

export class IdentityComponent extends Component {
  readonly _type = 'Identity';

  constructor(public variant: string) {
    super();
  }

  public reset(variant: string) {
    this.variant = variant;
    return this;
  }
}
