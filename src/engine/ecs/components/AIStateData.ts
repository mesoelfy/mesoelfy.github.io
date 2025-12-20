import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { AIBehaviorState, AI_STATE } from '@/engine/ai/AIStateTypes';
import { AIBlackboard } from '@/engine/ai/AIBlackboard';
import { AITimerID } from '@/engine/ai/AITimerID';

export class AIStateData extends Component {
  readonly _type = ComponentType.State;
  constructor(
    public current: AIBehaviorState = AI_STATE.IDLE,
    public timers: Partial<Record<AITimerID, number>> = {},
    public data: AIBlackboard = {},
    public treeState: Record<string, number> = {},
    public stunTimer: number = 0
  ) {
    super();
  }

  public reset(data: Partial<AIStateData>) {
    this.current = data.current ?? AI_STATE.IDLE;
    this.timers = data.timers ?? {};
    this.data = data.data ?? {};
    this.treeState = data.treeState ?? {};
    this.stunTimer = data.stunTimer ?? 0;
    return this;
  }
  
  public set(state: AIBehaviorState) {
    this.current = state;
  }
}
