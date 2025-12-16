import { Component } from '@/core/ecs/Component';
import { ComponentType } from '@/core/ecs/ComponentType';

export class AIStateData extends Component {
  readonly _type = ComponentType.State;

  constructor(
    public current: string = 'IDLE',
    public timers: Record<string, number> = {},
    public data: Record<string, any> = {}
  ) {
    super();
  }

  public reset(current: string = 'IDLE', timers: Record<string, number> = {}, data: Record<string, any> = {}) {
    this.current = current;
    this.timers = timers;
    this.data = data;
    return this;
  }
  
  public set(state: string) {
    this.current = state;
  }
}
