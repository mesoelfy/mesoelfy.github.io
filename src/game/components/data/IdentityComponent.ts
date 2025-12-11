import { Component } from '../../core/ecs/Component';

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
