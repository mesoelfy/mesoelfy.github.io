import { BTNode, NodeState } from '@/core/ai/behavior/types';
import { Entity } from '@/core/ecs/Entity';
import { AIContext } from '@/game/handlers/ai/types';
import { TransformData } from '@/game/data/TransformData';
import { AIStateData } from '@/game/data/AIStateData';
import { TargetData } from '@/game/data/TargetData';
import { OrbitalData } from '@/game/data/OrbitalData';
import { RenderData } from '@/game/data/RenderData';
import { ComponentType } from '@/core/ecs/ComponentType';

// --- ACTIONS ---

export class OrbitControl extends BTNode {
  constructor(private active: boolean) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const orbital = entity.getComponent<OrbitalData>(ComponentType.Orbital);
    if (!orbital) return NodeState.FAILURE;
    orbital.active = this.active;
    return NodeState.SUCCESS;
  }
}

export class ChargeMechanic extends BTNode {
  constructor(private duration: number) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const state = entity.getComponent<AIStateData>(ComponentType.State);
    if (!state) return NodeState.FAILURE;

    // Init
    if (typeof state.data.chargeProgress === 'undefined') {
        state.data.chargeProgress = 0;
    }

    // Charge
    if (state.data.chargeProgress < 1.0) {
        state.data.chargeProgress += context.delta / this.duration;
        
        // Clamp
        if (state.data.chargeProgress >= 1.0) {
            state.data.chargeProgress = 1.0;
            context.playSound('ui_optimal', 0); // Audio feedback when full
            return NodeState.SUCCESS;
        }
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

    // Calculate Direction to Target
    const dx = target.x - transform.x;
    const dy = target.y - transform.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    // Default to forward if no target (safety)
    let dirX = 1, dirY = 0;
    
    if (dist > 0.001) {
        dirX = dx / dist;
        dirY = dy / dist;
    }

    // Spawn
    context.spawnProjectile(
        transform.x + (dirX * 0.5), 
        transform.y + (dirY * 0.5), 
        dirX * this.speed, 
        dirY * this.speed, 
        this.damage, 
        'DAEMON_ORB', 
        entity.id as number
    );

    // FX
    context.spawnFX('IMPACT_WHITE', transform.x, transform.y);
    context.playSound('fx_teleport', transform.x);

    // Reset Charge
    state.data.chargeProgress = 0;
    state.data.lastFireTime = context.time;

    return NodeState.SUCCESS;
  }
}

export class DaemonAim extends BTNode {
  private readonly TURN_SPEED = 5.0;

  tick(entity: Entity, context: AIContext): NodeState {
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const state = entity.getComponent<AIStateData>(ComponentType.State);
    const render = entity.getComponent<RenderData>(ComponentType.Render);

    if (!transform || !target || !state || !render) return NodeState.FAILURE;

    // 1. Determine Target Angle
    let targetAngle = 0;
    const isCharged = state.data.chargeProgress >= 1.0;
    const hasEnemy = target.id !== null && target.id !== undefined;

    if (isCharged && hasEnemy) {
        // Face Enemy
        const dx = target.x - transform.x;
        const dy = target.y - transform.y;
        targetAngle = Math.atan2(dy, dx);
    } else {
        // Face Player (Center 0,0 relative to self)
        // Since Daemon orbits 0,0, facing center is just atan2(-y, -x)
        targetAngle = Math.atan2(-transform.y, -transform.x);
    }

    // 2. Smooth Rotation
    let diff = targetAngle - transform.rotation;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    
    transform.rotation += diff * this.TURN_SPEED * context.delta;

    // 3. Update Render Spin (Visual Flair)
    render.visualRotation += context.delta * 2.0;

    return NodeState.SUCCESS;
  }
}

// --- CONDITIONS ---

export class HasTargetLock extends BTNode {
  tick(entity: Entity, context: AIContext): NodeState {
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    // TargetingSystem sets id to 'ENEMY_LOCKED' when it finds a valid enemy
    if (target && target.id) {
        return NodeState.SUCCESS;
    }
    return NodeState.FAILURE;
  }
}
