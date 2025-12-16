import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class CombatData extends Component {
  readonly _type = ComponentType.Combat;

  constructor(
    public damage: number,
    public cooldown: number = 0,
    public range: number = 0
  ) {
    super();
  }

  public reset(damage: number, cooldown: number = 0, range: number = 0) {
    this.damage = damage;
    this.cooldown = cooldown;
    this.range = range;
    return this;
  }
}
