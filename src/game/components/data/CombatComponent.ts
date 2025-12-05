import { Component } from '../../core/ecs/Component';

export class CombatComponent extends Component {
  readonly _type = 'Combat';

  constructor(
    public damage: number,
    public cooldown: number = 0, // Time until next attack
    public range: number = 0
  ) {
    super();
  }
}
