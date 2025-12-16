import { Entity } from '@/core/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { Sequence, Parallel } from '@/core/ai/behavior/composites';
import { Succeeder } from '@/core/ai/behavior/decorators';
import { MoveToTarget, SpinVisual } from '@/game/ai/nodes/actions';
import { SpawnPhase } from '@/game/ai/nodes/logic';
import { EnemyTypes } from '@/game/config/Identifiers';

let treeRoot: any = null;

const getKamikazeTree = (config: any) => {
    if (treeRoot) return treeRoot;

    treeRoot = new Sequence([
        // 1. Warm up
        new SpawnPhase(1.5),
        
        // 2. Main Loop: Move AND Spin
        new Parallel([
            new Succeeder(new SpinVisual(10.0)), // Fast Tumble
            new MoveToTarget(config.baseSpeed)   // Homing Missile
        ])
    ]);
    return treeRoot;
};

export const KamikazeLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    const config = ctx.config.enemies[EnemyTypes.KAMIKAZE];
    const tree = getKamikazeTree(config);
    tree.tick(e, ctx);
  }
};
