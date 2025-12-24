import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { Sequence, Parallel, MemSequence } from '@/engine/ai/behavior/composites';
import { SpawnPhase } from '@/engine/ai/nodes/logic';
import { Wait } from '@/engine/ai/nodes/actions';
import { OrbitControl, DaemonAim, ChargeMechanic, HasTargetLock, FireDaemonShot } from '@/engine/ai/nodes/daemonNodes';

const DAEMON_TREE = new Sequence([
  new SpawnPhase(),
  new Parallel([
    new OrbitControl('ACTIVE'),
    new DaemonAim(),
    new MemSequence([
      new ChargeMechanic(),
      new HasTargetLock(),
      new FireDaemonShot(),
      new Wait('waitDuration')
    ], 'daemon_cycle')
  ])
]);

export const DaemonLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    DAEMON_TREE.tick(e, ctx);
  }
};
