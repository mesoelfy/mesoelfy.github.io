import { BTNode } from './behavior/types';
import { Sequence, Selector, Parallel, MemSequence } from './behavior/composites';
import { Inverter, Succeeder } from './behavior/decorators';

// Actions
import { MoveToTarget, Wait, SpinVisual } from './nodes/actions';
import { SpawnPhase } from './nodes/logic';

// Conditions
import { IsTargetInRange } from './nodes/conditions';

// Specifics
import { DrillAttack } from './nodes/drillerNodes';
import { HoverDrift, AimAndFire } from './nodes/hunterNodes';
import { OrbitControl, ChargeMechanic, FireDaemonShot, HasTargetLock, DaemonAim } from './nodes/daemonNodes';

type NodeConstructor = new (...args: any[]) => BTNode;

class NodeRegistry {
  private map = new Map<string, NodeConstructor>();

  constructor() {
    // Composites
    this.register('Sequence', Sequence);
    this.register('Selector', Selector);
    this.register('Parallel', Parallel);
    this.register('MemSequence', MemSequence);

    // Decorators
    this.register('Inverter', Inverter);
    this.register('Succeeder', Succeeder);

    // Common Actions
    this.register('MoveToTarget', MoveToTarget);
    this.register('Wait', Wait);
    this.register('SpinVisual', SpinVisual);
    this.register('SpawnPhase', SpawnPhase);

    // Conditions
    this.register('IsTargetInRange', IsTargetInRange);

    // Driller
    this.register('DrillAttack', DrillAttack);

    // Hunter
    this.register('HoverDrift', HoverDrift);
    this.register('AimAndFire', AimAndFire); // NEW

    // Daemon
    this.register('OrbitControl', OrbitControl);
    this.register('ChargeMechanic', ChargeMechanic);
    this.register('FireDaemonShot', FireDaemonShot);
    this.register('HasTargetLock', HasTargetLock);
    this.register('DaemonAim', DaemonAim);
  }

  public register(key: string, ctor: NodeConstructor) {
    this.map.set(key, ctor);
  }

  public get(key: string): NodeConstructor | undefined {
    return this.map.get(key);
  }
}

export const BehaviorNodeRegistry = new NodeRegistry();
