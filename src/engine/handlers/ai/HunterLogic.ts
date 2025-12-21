import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { Sequence, MemSequence } from '@/engine/ai/behavior/composites';
import { SpawnPhase } from '@/engine/ai/nodes/logic';
import { HoverDrift, AimAndFire } from '@/engine/ai/nodes/hunterNodes';
import { Wait } from '@/engine/ai/nodes/actions';

const HUNTER_TREE = new Sequence([
  new SpawnPhase(1.5),
  new MemSequence([
    // 1. Approach & Drift (MinRange, MaxRange, MinDur, MaxDur)
    new HoverDrift(10.0, 18.0, 0.8, 1.5),
    
    // 2. Aim & Fire (AimDuration, Speed, ConfigID)
    new AimAndFire(0.5, 40.0, 'ENEMY_HUNTER'),
    
    // 3. Cooldown
    new Wait(0.3, 0.6)
  ], 'hunter_tactics')
]);

export const HunterLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    HUNTER_TREE.tick(e, ctx);
  }
};
