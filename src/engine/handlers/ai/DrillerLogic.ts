import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { Sequence, Selector } from '@/engine/ai/behavior/composites';
import { Succeeder } from '@/engine/ai/behavior/decorators';
import { SpawnPhase } from '@/engine/ai/nodes/logic';
import { SpinVisual, MoveToTarget } from '@/engine/ai/nodes/actions';
import { IsTargetInRange } from '@/engine/ai/nodes/conditions';
import { DrillAttack } from '@/engine/ai/nodes/drillerNodes';

const DRILLER_TREE = new Sequence([
  new SpawnPhase(),
  new Sequence([
    new Succeeder(new SpinVisual()), // Defaults to 'spinSpeed'
    new Selector([
      new Sequence([
        new IsTargetInRange(1.5),
        new Succeeder(new SpinVisual('spinSpeed', 15.0)), 
        new DrillAttack()
      ]),
      new MoveToTarget('approachSpeed', 'approachStopDist')
    ])
  ])
]);

export const DrillerLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    DRILLER_TREE.tick(e, ctx);
  }
};
