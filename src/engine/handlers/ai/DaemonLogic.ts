import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { BehaviorTreeBuilder, NodeDef } from '@/engine/ai/BehaviorTreeBuilder';

const DAEMON_DEF: NodeDef = {
  type: 'Sequence',
  children: [
    { type: 'SpawnPhase', args: [1.0] },
    {
        type: 'Parallel',
        children: [
            { type: 'OrbitControl', args: ['ACTIVE'] },
            { type: 'DaemonAim' },
            {
                type: 'MemSequence',
                id: 'daemon_cycle',
                children: [
                    { type: 'ChargeMechanic', args: [2.0] },
                    { type: 'HasTargetLock' },
                    { type: 'FireDaemonShot', args: [35.0, 20] },
                    { type: 'Wait', args: [0.5] }
                ]
            }
        ]
    }
  ]
};

let treeRoot: any = null;

export const DaemonLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    if (!treeRoot) treeRoot = BehaviorTreeBuilder.build(DAEMON_DEF);
    treeRoot.tick(e, ctx);
  }
};
