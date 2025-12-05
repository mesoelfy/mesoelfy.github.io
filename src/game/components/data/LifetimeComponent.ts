import { Component } from '../../core/ecs/Component';

// Used for bullets and particles that die after N seconds
export class LifetimeComponent extends Component {
  readonly _type = 'Lifetime';

  constructor(
    public remaining: number, // Seconds
    public total: number
  ) {
    super();
  }
}
