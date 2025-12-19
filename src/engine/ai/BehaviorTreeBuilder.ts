import { BehaviorNodeRegistry } from './BehaviorNodeRegistry';
import { BTNode } from './behavior/types';

export interface NodeDef {
  type: string;
  args?: any[];
  children?: NodeDef[];
  id?: string; // For MemSequence
}

export class BehaviorTreeBuilder {
  
  public static build(def: NodeDef): BTNode {
    const Ctor = BehaviorNodeRegistry.get(def.type);
    
    if (!Ctor) {
      throw new Error(`[BehaviorTreeBuilder] Unknown node type: ${def.type}`);
    }

    // 1. Build Children recursively
    let childrenInstances: BTNode[] = [];
    if (def.children) {
      childrenInstances = def.children.map(childDef => this.build(childDef));
    }

    // 2. Construct Instance
    // Case A: Composites (Sequence, Selector, Parallel) take children as first arg
    // Case B: Decorators (Inverter, Succeeder) take single child as first arg
    // Case C: Leafs take args...
    
    const isComposite = ['Sequence', 'Selector', 'Parallel', 'MemSequence'].includes(def.type);
    const isDecorator = ['Inverter', 'Succeeder'].includes(def.type);

    if (isComposite) {
        if (def.type === 'MemSequence') {
             // MemSequence(children, id)
             return new Ctor(childrenInstances, def.id || 'default_mem_seq');
        }
        return new Ctor(childrenInstances);
    } 
    else if (isDecorator) {
        if (childrenInstances.length === 0) {
            throw new Error(`[BehaviorTreeBuilder] Decorator ${def.type} requires a child.`);
        }
        return new Ctor(childrenInstances[0]);
    } 
    else {
        // Leaf Node
        const args = def.args || [];
        return new Ctor(...args);
    }
  }
}
