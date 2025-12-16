import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class AIStateData extends Component {
  readonly _type = ComponentType.State;

  constructor(
    public current: string = 'IDLE',
    public timers: Record<string, number> = {},
    public data: Record<string, any> = {},
    public treeState: any = null // Stores running node indices for BTs
  ) {
    super();
  }

  public reset(current: string = 'IDLE', timers: Record<string, number> = {}, data: Record<string, any> = {}, treeState: any = null) {
    this.current = current;
    this.timers = timers;
    this.data = data;
    this.treeState = treeState;
    return this;
  }
  
  public set(state: string) {
    this.current = state;
  }
}
