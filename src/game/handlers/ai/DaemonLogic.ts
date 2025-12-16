import { Entity } from '@/core/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { Sequence, Parallel, MemSequence } from '@/core/ai/behavior/composites';
import { Succeeder } from '@/core/ai/behavior/decorators';
import { Wait } from '@/game/ai/nodes/actions';
import { SpawnPhase } from '@/game/ai/nodes/logic';
import { OrbitControl, ChargeMechanic, FireDaemonShot, HasTargetLock } from '@/game/ai/nodes/daemonNodes';

let treeRoot: any = null;

const getDaemonTree = (config: any) => {
    if (treeRoot) return treeRoot;

    // --- BEHAVIOR ARCHITECTURE ---
    // 1. Always Orbit (Parallel)
    // 2. Logic Loop (MemSequence):
    //    a. Charge (Squish -> Unsquish handled by Actor reading chargeProgress)
    //    b. Acquire Target
    //    c. Fire (Reset chargeProgress -> Squish)
    
    const combatCycle = new MemSequence([
        // Phase 1: Charge Up (2.0s)
        // This gradually sets AIStateData.data.chargeProgress from 0 to 1
        new ChargeMechanic(2.0),

        // Phase 2: Wait for Target
        // If no enemy is near, it stays fully charged (Unsquished)
        new HasTargetLock(),

        // Phase 3: Attack
        // Fires projectile at target and resets chargeProgress to 0 immediately
        new FireDaemonShot(35.0, 20),
        
        // Phase 4: Brief Recovery
        new Wait(0.5)
    ], 'daemon_cycle');

    treeRoot = new Sequence([
        new SpawnPhase(1.0),
        new Parallel([
            new OrbitControl(true), // Always orbit player
            combatCycle
        ])
    ]);

    return treeRoot;
};

export const DaemonLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    const tree = getDaemonTree(null);
    tree.tick(e, ctx);
  }
};
