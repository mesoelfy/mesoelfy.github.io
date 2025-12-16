import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { Sequence, Parallel, MemSequence } from '@/engine/ai/behavior/composites';
import { Wait } from '@/engine/ai/nodes/actions';
import { SpawnPhase } from '@/engine/ai/nodes/logic';
import { HoverDrift, FaceTarget, FireProjectile, ExhaustFX } from '@/engine/ai/nodes/hunterNodes';
import { EnemyTypes } from '@/engine/config/Identifiers';

let treeRoot: any = null;

const getHunterTree = (config: any) => {
    if (treeRoot) return treeRoot;

    const tacticalLoop = new MemSequence([
        new HoverDrift(8.0, 16.0, 2.0), // 1. Drift/Hover
        new FaceTarget(),               // 2. Aim
        
        // 3. Charge Up (Visuals + Delay)
        new Parallel([
            new Wait(0.5),
            new ExhaustFX()
        ]),
        
        new FireProjectile(40.0, 'ENEMY_HUNTER'), // 4. Fire
        new Wait(1.0)                             // 5. Cooldown
    ], 'hunter_tactics');

    treeRoot = new Sequence([
        new SpawnPhase(1.5), 
        tacticalLoop
    ]);
    return treeRoot;
};

export const HunterLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    const config = ctx.config.enemies[EnemyTypes.HUNTER];
    const tree = getHunterTree(config);
    tree.tick(e, ctx);
  }
};
