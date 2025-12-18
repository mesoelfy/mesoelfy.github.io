import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { Sequence, Parallel, MemSequence } from '@/engine/ai/behavior/composites';
import { Wait } from '@/engine/ai/nodes/actions';
import { SpawnPhase } from '@/engine/ai/nodes/logic';
import { HoverDrift, FaceTarget, FireProjectile, ExhaustFX } from '@/engine/ai/nodes/hunterNodes';

let treeRoot: any = null;

const getHunterTree = () => {
    if (treeRoot) return treeRoot;

    const tacticalLoop = new MemSequence([
        // INCREASED RANGE: 10-18 units (was 8-16)
        // FASTER REPOSITION: 1.5s (was 2.0s)
        new HoverDrift(10.0, 18.0, 1.5),
        new FaceTarget(),
        
        new Parallel([
            new Wait(0.5),
            new ExhaustFX()
        ]),
        
        new FireProjectile(40.0, 'ENEMY_HUNTER'),
        
        // FASTER FIRE RATE: Reduced cooldown to 0.6s (was 1.0s)
        new Wait(0.6)
    ], 'hunter_tactics');

    treeRoot = new Sequence([
        new SpawnPhase(1.5), 
        tacticalLoop
    ]);
    return treeRoot;
};

export const HunterLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    const tree = getHunterTree();
    tree.tick(e, ctx);
  }
};
