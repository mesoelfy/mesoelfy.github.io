import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { Sequence, Selector } from '@/engine/ai/behavior/composites';
import { Succeeder } from '@/engine/ai/behavior/decorators';
import { SpawnPhase } from '@/engine/ai/nodes/logic';
import { SpinVisual, MoveToTarget } from '@/engine/ai/nodes/actions';
import { IsTargetInRange } from '@/engine/ai/nodes/conditions';
import { DrillAttack } from '@/engine/ai/nodes/drillerNodes';

const DRILLER_TREE = new Sequence([
  new SpawnPhase(1.5),
  new Sequence([
    // Always spin slowly while moving
    new Succeeder(new SpinVisual(5.0)),
    
    new Selector([
      // A. Attack Sequence
      new Sequence([
        new IsTargetInRange(1.5),
        new Succeeder(new SpinVisual(15.0)), // Spin faster when drilling
        // Updated Interval: 0.08s (12.5Hz) for sustained panel shake
        new DrillAttack(0.08) 
      ]),
      
      // B. Approach (Fallback / Repath)
      new MoveToTarget(8, 1.2)
    ])
  ])
]);

export const DrillerLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    DRILLER_TREE.tick(e, ctx);
  }
};
