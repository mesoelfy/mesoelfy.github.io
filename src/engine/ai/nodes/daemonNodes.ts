import { BTNode, NodeState } from '@/engine/ai/behavior/types';
import { Entity } from '@/engine/ecs/Entity';
import { AIContext } from '@/engine/handlers/ai/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { OrbitalData } from '@/engine/ecs/components/OrbitalData';
import { RenderTransform } from '@/engine/ecs/components/RenderTransform';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { AI_STATE } from '@/engine/ai/AIStateTypes';

export class OrbitControl extends BTNode {
  constructor(private state: 'ACTIVE' | 'IDLE') { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const orbital = entity.getComponent<OrbitalData>(ComponentType.Orbital);
    if (!orbital) return NodeState.FAILURE;
    orbital.active = (this.state === 'ACTIVE');
    return NodeState.SUCCESS;
  }
}

export class ChargeMechanic extends BTNode {
  constructor(private duration: number) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const state = entity.getComponent<AIStateData>(ComponentType.State);
    if (!state) return NodeState.FAILURE;

    const currentProgress = state.data.chargeProgress || 0;

    if (currentProgress < 1.0) {
        state.data.chargeProgress = currentProgress + (context.delta / this.duration);
        
        if (state.data.chargeProgress >= 1.0) {
            state.data.chargeProgress = 1.0;
            state.current = AI_STATE.READY;
            context.playSound('ui_optimal', 0); 
            return NodeState.SUCCESS;
        }
        state.current = AI_STATE.CHARGING;
        return NodeState.RUNNING;
    }

    return NodeState.SUCCESS;
  }
}

export class FireDaemonShot extends BTNode {
  constructor(private speed: number, private damage: number) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const state = entity.getComponent<AIStateData>(ComponentType.State);

    if (!transform || !target || !state) return NodeState.FAILURE;

    const dx = target.x - transform.x;
    const dy = target.y - transform.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    let dirX = 1, dirY = 0;
    
    if (dist > 0.001) {
        dirX = dx / dist;
        dirY = dy / dist;
    }

    context.spawnProjectile(
        transform.x + (dirX * 0.5), 
        transform.y + (dirY * 0.5), 
        dirX * this.speed, 
        dirY * this.speed, 
        this.damage, 
        'DAEMON_ORB', 
        entity.id as number
    );

    context.spawnFX('IMPACT_WHITE', transform.x, transform.y);
    context.playSound('fx_teleport', transform.x);

    state.data.chargeProgress = 0;
    state.data.lastFireTime = context.time;
    state.current = AI_STATE.ORBIT;

    return NodeState.SUCCESS;
  }
}

export class DaemonAim extends BTNode {
  private readonly TURN_SPEED = 5.0;

  tick(entity: Entity, context: AIContext): NodeState {
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const state = entity.getComponent<AIStateData>(ComponentType.State);
    const visual = entity.getComponent<RenderTransform>(ComponentType.RenderTransform);

    if (!transform || !target || !state || !visual) return NodeState.FAILURE;

    let targetAngle = 0;
    const charge = state.data.chargeProgress || 0;
    const isCharged = charge >= 1.0;
    const hasEnemy = target.id !== null && target.id !== undefined;

    if (isCharged && hasEnemy) {
        const dx = target.x - transform.x;
        const dy = target.y - transform.y;
        targetAngle = Math.atan2(dy, dx);
    } else {
        targetAngle = Math.atan2(-transform.y, -transform.x);
    }

    let diff = targetAngle - transform.rotation;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    
    transform.rotation += diff * this.TURN_SPEED * context.delta;
    visual.rotation += context.delta * 2.0;

    return NodeState.SUCCESS;
  }
}

export class HasTargetLock extends BTNode {
  tick(entity: Entity, context: AIContext): NodeState {
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    if (target && target.id) {
        return NodeState.SUCCESS;
    }
    return NodeState.FAILURE;
  }
}
