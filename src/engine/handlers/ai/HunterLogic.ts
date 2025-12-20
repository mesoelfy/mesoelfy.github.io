import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { BehaviorTreeBuilder, NodeDef } from '@/engine/ai/BehaviorTreeBuilder';

const HUNTER_DEF: NodeDef = {
  type: 'Sequence',
  children: [
    { type: 'SpawnPhase', args: [1.5] },
    {
        type: 'MemSequence',
        id: 'hunter_tactics',
        children: [
            // 1. Approach & Drift
            { type: 'HoverDrift', args: [10.0, 18.0, 0.8, 1.5] },
            
            // 2. Aim & Fire (Atomic Operation)
            // AimDuration, ProjectileSpeed, ConfigID
            { type: 'AimAndFire', args: [0.5, 40.0, 'ENEMY_HUNTER'] },
            
            // 3. Cooldown
            { type: 'Wait', args: [0.3, 0.6] }
        ]
    }
  ]
};

let treeRoot: any = null;

export const HunterLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    if (!treeRoot) {
        treeRoot = BehaviorTreeBuilder.build(HUNTER_DEF);
    }
    treeRoot.tick(e, ctx);
  }
};
