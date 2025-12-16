import { BTNode, NodeState } from './types';
import { Entity } from '@/core/ecs/Entity';
import { AIContext } from '@/game/handlers/ai/types';

/**
 * Runs children in order. 
 * Returns RUNNING if a child is running.
 * Returns FAILURE if a child fails (and stops).
 * Returns SUCCESS if all children succeed.
 */
export class Sequence extends BTNode {
  constructor(private children: BTNode[]) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    for (const child of this.children) {
      const status = child.tick(entity, context);
      if (status !== NodeState.SUCCESS) {
        return status;
      }
    }
    return NodeState.SUCCESS;
  }
}

/**
 * Runs children in order.
 * Returns SUCCESS if a child succeeds (and stops).
 * Returns RUNNING if a child is running.
 * Returns FAILURE if all children fail.
 */
export class Selector extends BTNode {
  constructor(private children: BTNode[]) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    for (const child of this.children) {
      const status = child.tick(entity, context);
      if (status !== NodeState.FAILURE) {
        return status;
      }
    }
    return NodeState.FAILURE;
  }
}

/**
 * Runs ALL children every tick.
 * Returns FAILURE if any child fails.
 * Returns RUNNING if any child is running.
 * Returns SUCCESS if all children succeed.
 */
export class Parallel extends BTNode {
  constructor(private children: BTNode[]) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    let anyRunning = false;

    for (const child of this.children) {
      const status = child.tick(entity, context);
      
      if (status === NodeState.FAILURE) {
        return NodeState.FAILURE;
      }
      
      if (status === NodeState.RUNNING) {
        anyRunning = true;
      }
    }

    return anyRunning ? NodeState.RUNNING : NodeState.SUCCESS;
  }
}

/**
 * Stateful Sequence (Memory Sequence).
 * Remembers the running child index and resumes from there.
 * Resets index to 0 only when the whole sequence Succeeds or Fails.
 */
export class MemSequence extends BTNode {
  constructor(private children: BTNode[], private id: string) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const state = entity.getComponent<any>('State'); // Generic access
    if (!state) return NodeState.FAILURE;

    // Initialize Tree State if missing
    if (!state.treeState) state.treeState = {};
    
    // Get running index (default 0)
    let startIndex = state.treeState[this.id] || 0;

    for (let i = startIndex; i < this.children.length; i++) {
      const child = this.children[i];
      const status = child.tick(entity, context);

      if (status === NodeState.RUNNING) {
        state.treeState[this.id] = i; // Remember this child is running
        return NodeState.RUNNING;
      }

      if (status === NodeState.FAILURE) {
        state.treeState[this.id] = 0; // Reset on failure
        return NodeState.FAILURE;
      }
    }

    // All children succeeded
    state.treeState[this.id] = 0; // Reset on success
    return NodeState.SUCCESS;
  }
}
