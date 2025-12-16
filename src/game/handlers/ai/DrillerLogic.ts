import { Entity } from '@/core/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { Sequence, Selector } from '@/core/ai/behavior/composites';
import { Succeeder } from '@/core/ai/behavior/decorators';
import { MoveToTarget, SpinVisual } from '@/game/ai/nodes/actions';
import { IsTargetInRange } from '@/game/ai/nodes/conditions';
import { DrillAttack } from '@/game/ai/nodes/drillerNodes';
import { SpawnPhase } from '@/game/ai/nodes/logic'; // Imported
import { ENEMY_CONFIG } from '@/game/config/EnemyConfig';
import { EnemyTypes } from '@/game/config/Identifiers';

let treeRoot: any = null;

const getDrillerTree = (config: any) => {
    if (treeRoot) return treeRoot;

    // ROOT SEQUENCE:
    // 1. Spawn Phase (Blocks until ready)
    // 2. Main Loop (Spin + Decide)
    
    treeRoot = new Sequence([
        new SpawnPhase(1.5), 
        
        new Sequence([
            new Succeeder(new SpinVisual(5.0)), // Always spin visually
            new Selector([
                // Attack Branch
                new Sequence([
                    new IsTargetInRange(0.5), 
                    new Succeeder(new SpinVisual(15.0)), // Fast spin
                    new DrillAttack(config.damage, 0.2)
                ]),
                // Move Branch
                new MoveToTarget(config.baseSpeed)
            ])
        ])
    ]);
    return treeRoot;
};

export const DrillerLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    const config = ctx.config.enemies[EnemyTypes.DRILLER];
    const tree = getDrillerTree(config);
    tree.tick(e, ctx);
  }
};
