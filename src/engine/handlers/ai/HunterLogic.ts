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
            // HoverDrift(minRange, maxRange, minDuration, maxDuration)
            // Was 1.5 -> Now 0.8 to 1.5
            { type: 'HoverDrift', args: [10.0, 18.0, 0.8, 1.5] },
            
            { type: 'FaceTarget' },
            
            { 
                type: 'Parallel', 
                children: [
                    // Aiming Wait: Was 0.5 -> Now 0.2 to 0.5
                    { type: 'Wait', args: [0.2, 0.5] },
                    { type: 'ExhaustFX' }
                ] 
            },
            
            // FireProjectile(speed, configId)
            { type: 'FireProjectile', args: [40.0, 'ENEMY_HUNTER'] },
            
            // Cooldown Wait: Was 0.6 -> Now 0.3 to 0.6
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
