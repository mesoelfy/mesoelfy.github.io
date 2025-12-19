import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { AIBehaviorState, AI_STATE } from '@/engine/ai/AIStateTypes';

export class AIStateData extends Component {
  readonly _type = ComponentType.State;

  constructor(
    public current: AIBehaviorState = AI_STATE.IDLE,
    public timers: Record<string, number> = {},
    public data: Record<string, any> = {},
    public treeState: any = null,
    public stunTimer: number = 0
  ) {
    super();
  }

  public reset(data: Partial<AIStateData>) {
    this.current = data.current ?? AI_STATE.IDLE;
    this.timers = data.timers ?? {};
    this.data = data.data ?? {};
    this.treeState = data.treeState ?? null;
    this.stunTimer = data.stunTimer ?? 0;
    return this;
  }
  
  public set(state: AIBehaviorState) {
    this.current = state;
  }
}
