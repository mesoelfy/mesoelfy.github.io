import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { Sequence, Parallel } from '@/engine/ai/behavior/composites';
import { Succeeder } from '@/engine/ai/behavior/decorators';
import { MoveToTarget, SpinVisual } from '@/engine/ai/nodes/actions';
import { SpawnPhase } from '@/engine/ai/nodes/logic';

const BASE_SPEED = 12;

let treeRoot: any = null;

const getKamikazeTree = () => {
    if (treeRoot) return treeRoot;

    treeRoot = new Sequence([
        new SpawnPhase(1.5),
        
        new Parallel([
            new Succeeder(new SpinVisual(10.0)), 
            new MoveToTarget(BASE_SPEED)
        ])
    ]);
    return treeRoot;
};

export const KamikazeLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    const tree = getKamikazeTree();
    tree.tick(e, ctx);
  }
};
