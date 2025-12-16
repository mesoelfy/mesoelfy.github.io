import { BTNode, NodeState } from './types';
import { Entity } from '@/engine/ecs/Entity';
import { AIContext } from '@/engine/handlers/ai/types';

export class Inverter extends BTNode {
  constructor(private child: BTNode) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const status = this.child.tick(entity, context);
    if (status === NodeState.SUCCESS) return NodeState.FAILURE;
    if (status === NodeState.FAILURE) return NodeState.SUCCESS;
    return NodeState.RUNNING;
  }
}

export class Succeeder extends BTNode {
  constructor(private child: BTNode) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const status = this.child.tick(entity, context);
    if (status === NodeState.RUNNING) return NodeState.RUNNING;
    return NodeState.SUCCESS;
  }
}
