import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class CombatData extends Component {
  readonly _type = ComponentType.Combat;

  constructor(
    public damage: number = 0,
    public cooldown: number = 0,
    public range: number = 0
  ) {
    super();
  }

  public reset(data: Partial<CombatData>) {
    this.damage = data.damage ?? 0;
    this.cooldown = data.cooldown ?? 0;
    this.range = data.range ?? 0;
    return this;
  }
}
