import { BTNode, NodeState } from './types';
import { Entity } from '@/engine/ecs/Entity';
import { AIContext } from '@/engine/handlers/ai/types';

export class Sequence extends BTNode {
  constructor(private children: BTNode[]) { super(); }
  tick(entity: Entity, context: AIContext): NodeState {
    for (const child of this.children) {
      const status = child.tick(entity, context);
      if (status !== NodeState.SUCCESS) return status;
    }
    return NodeState.SUCCESS;
  }
}

export class Selector extends BTNode {
  constructor(private children: BTNode[]) { super(); }
  tick(entity: Entity, context: AIContext): NodeState {
    for (const child of this.children) {
      const status = child.tick(entity, context);
      if (status !== NodeState.FAILURE) return status;
    }
    return NodeState.FAILURE;
  }
}

export class Parallel extends BTNode {
  constructor(private children: BTNode[]) { super(); }
  tick(entity: Entity, context: AIContext): NodeState {
    let anyRunning = false;
    for (const child of this.children) {
      const status = child.tick(entity, context);
      if (status === NodeState.FAILURE) return NodeState.FAILURE;
      if (status === NodeState.RUNNING) anyRunning = true;
    }
    return anyRunning ? NodeState.RUNNING : NodeState.SUCCESS;
  }
}

export class MemSequence extends BTNode {
  constructor(private children: BTNode[], private id: string) { super(); }
  tick(entity: Entity, context: AIContext): NodeState {
    const state = entity.getComponent<any>('State');
    if (!state) return NodeState.FAILURE;
    if (!state.treeState) state.treeState = {};
    let startIndex = state.treeState[this.id] || 0;
    for (let i = startIndex; i < this.children.length; i++) {
      const status = this.children[i].tick(entity, context);
      if (status === NodeState.RUNNING) {
        state.treeState[this.id] = i;
        return NodeState.RUNNING;
      }
      if (status === NodeState.FAILURE) {
        state.treeState[this.id] = 0;
        return NodeState.FAILURE;
      }
    }
    state.treeState[this.id] = 0;
    return NodeState.SUCCESS;
  }
}
