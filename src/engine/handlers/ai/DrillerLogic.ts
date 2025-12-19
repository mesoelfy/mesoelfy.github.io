import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { BehaviorTreeBuilder, NodeDef } from '@/engine/ai/BehaviorTreeBuilder';

const DRILLER_DEF: NodeDef = {
  type: 'Sequence',
  children: [
    { type: 'SpawnPhase', args: [1.5] },
    {
      type: 'Sequence',
      children: [
        { type: 'Succeeder', children: [{ type: 'SpinVisual', args: [5.0] }] },
        {
          type: 'Selector',
          children: [
            {
              type: 'Sequence',
              children: [
                { type: 'IsTargetInRange', args: [0.5] },
                { type: 'Succeeder', children: [{ type: 'SpinVisual', args: [15.0] }] },
                { type: 'DrillAttack', args: [0.2] }
              ]
            },
            { type: 'MoveToTarget', args: [8] }
          ]
        }
      ]
    }
  ]
};

let treeRoot: any = null;

export const DrillerLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    if (!treeRoot) treeRoot = BehaviorTreeBuilder.build(DRILLER_DEF);
    treeRoot.tick(e, ctx);
  }
};
