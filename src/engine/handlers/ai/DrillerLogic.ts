import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { Sequence, Selector } from '@/engine/ai/behavior/composites';
import { Succeeder } from '@/engine/ai/behavior/decorators';
import { MoveToTarget, SpinVisual } from '@/engine/ai/nodes/actions';
import { IsTargetInRange } from '@/engine/ai/nodes/conditions';
import { DrillAttack } from '@/engine/ai/nodes/drillerNodes';
import { SpawnPhase } from '@/engine/ai/nodes/logic';

const BASE_SPEED = 8;

let treeRoot: any = null;

const getDrillerTree = () => {
    if (treeRoot) return treeRoot;

    treeRoot = new Sequence([
        new SpawnPhase(1.5), 
        
        new Sequence([
            new Succeeder(new SpinVisual(5.0)), 
            new Selector([
                new Sequence([
                    new IsTargetInRange(0.5), 
                    new Succeeder(new SpinVisual(15.0)), 
                    new DrillAttack(0.2) // Interval only
                ]),
                new MoveToTarget(BASE_SPEED)
            ])
        ])
    ]);
    return treeRoot;
};

export const DrillerLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    const tree = getDrillerTree();
    tree.tick(e, ctx);
  }
};
