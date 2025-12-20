import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class StateColor extends Component {
  readonly _type = ComponentType.StateColor;

  constructor(
    public base: string = '#FFFFFF',
    public damaged: string = '#FF0000',
    public dead: string = '#FF0000',
    public repair: string = '#00FFFF',
    public reboot: string = '#9E4EA5'
  ) {
    super();
  }

  public reset(data: Partial<StateColor>) {
    this.base = data.base ?? '#FFFFFF';
    this.damaged = data.damaged ?? '#FF0000';
    this.dead = data.dead ?? '#FF0000';
    this.repair = data.repair ?? '#00FFFF';
    this.reboot = data.reboot ?? '#9E4EA5';
    return this;
  }
}
