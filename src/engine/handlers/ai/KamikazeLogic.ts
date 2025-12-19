import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { BehaviorTreeBuilder, NodeDef } from '@/engine/ai/BehaviorTreeBuilder';

const KAMIKAZE_DEF: NodeDef = {
  type: 'Sequence',
  children: [
    { type: 'SpawnPhase', args: [1.5] },
    {
      type: 'Parallel',
      children: [
        { 
            type: 'Succeeder', 
            children: [{ type: 'SpinVisual', args: [10.0] }] 
        },
        { type: 'MoveToTarget', args: [12] } // Speed
      ]
    }
  ]
};

let treeRoot: any = null;

export const KamikazeLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    if (!treeRoot) {
        treeRoot = BehaviorTreeBuilder.build(KAMIKAZE_DEF);
    }
    treeRoot.tick(e, ctx);
  }
};
