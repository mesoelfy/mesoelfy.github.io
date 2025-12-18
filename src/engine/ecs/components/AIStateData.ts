import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class AIStateData extends Component {
  readonly _type = ComponentType.State;

  constructor(
    public current: string = 'IDLE',
    public timers: Record<string, number> = {},
    public data: Record<string, any> = {},
    public treeState: any = null
  ) {
    super();
  }

  public reset(data: Partial<AIStateData>) {
    this.current = data.current ?? 'IDLE';
    this.timers = data.timers ?? {};
    this.data = data.data ?? {};
    this.treeState = data.treeState ?? null;
    return this;
  }
  
  public set(state: string) {
    this.current = state;
  }
}
