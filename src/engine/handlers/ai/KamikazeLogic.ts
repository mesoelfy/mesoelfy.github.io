import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { Sequence, Parallel } from '@/engine/ai/behavior/composites';
import { Succeeder } from '@/engine/ai/behavior/decorators';
import { SpawnPhase } from '@/engine/ai/nodes/logic';
import { SpinVisual, MoveToTarget } from '@/engine/ai/nodes/actions';

const KAMIKAZE_TREE = new Sequence([
  new SpawnPhase(),
  new Parallel([
    new Succeeder(
      new SpinVisual()
    ),
    new MoveToTarget('moveSpeed')
  ])
]);

export const KamikazeLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    KAMIKAZE_TREE.tick(e, ctx);
  }
};
