import { Component } from '../../core/ecs/Component';

export class StateComponent extends Component {
  readonly _type = 'State';

  constructor(
    public current: string = 'IDLE',
    public timers: Record<string, number> = {},
    public data: Record<string, any> = {}
  ) {
    super();
  }

  public set(state: string) {
    this.current = state;
  }
}
