import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { Sequence, Parallel, MemSequence } from '@/engine/ai/behavior/composites';
import { Wait } from '@/engine/ai/nodes/actions';
import { SpawnPhase } from '@/engine/ai/nodes/logic';
import { OrbitControl, ChargeMechanic, FireDaemonShot, HasTargetLock } from '@/engine/ai/nodes/daemonNodes';

let treeRoot: any = null;

const getDaemonTree = () => {
    if (treeRoot) return treeRoot;

    const combatCycle = new MemSequence([
        new ChargeMechanic(2.0),
        new HasTargetLock(),
        new FireDaemonShot(35.0, 20),
        new Wait(0.5)
    ], 'daemon_cycle');

    treeRoot = new Sequence([
        new SpawnPhase(1.0),
        new Parallel([
            new OrbitControl(true),
            combatCycle
        ])
    ]);

    return treeRoot;
};

export const DaemonLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    const tree = getDaemonTree();
    tree.tick(e, ctx);
  }
};
