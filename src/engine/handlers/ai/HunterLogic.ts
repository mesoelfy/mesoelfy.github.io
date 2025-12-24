import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { Sequence, MemSequence } from '@/engine/ai/behavior/composites';
import { SpawnPhase } from '@/engine/ai/nodes/logic';
import { RoamPanelZone, AimAndFire, HunterCooldown } from '@/engine/ai/nodes/hunterNodes';

const HUNTER_TREE = new Sequence([
  new SpawnPhase(),
  new MemSequence([
    new RoamPanelZone(),
    new AimAndFire('ENEMY_HUNTER'),
    new HunterCooldown()
  ], 'hunter_tactics')
]);

export const HunterLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    HUNTER_TREE.tick(e, ctx);
  }
};
