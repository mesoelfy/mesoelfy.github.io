import { Component } from '../../core/ecs/Component';

// This holds specific game logic identifiers (MUNCHER, HUNTER)
export class IdentityComponent extends Component {
  readonly _type = 'Identity';

  constructor(
    public variant: string // e.g. 'muncher', 'hunter', 'boss'
  ) {
    super();
  }
}
