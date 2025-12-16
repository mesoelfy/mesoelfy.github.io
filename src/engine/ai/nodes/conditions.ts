import { BTNode, NodeState } from '@/engine/ai/behavior/types';
import { Entity } from '@/engine/ecs/Entity';
import { AIContext } from '@/engine/handlers/ai/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class IsTargetInRange extends BTNode {
  constructor(private range: number) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    
    if (!transform || !target) return NodeState.FAILURE;

    let tx = target.x;
    let ty = target.y;

    // Logic: If target is a Panel, clamp destination to the panel edges
    if (target.type === 'PANEL' && target.id) {
        const rect = context.getPanelRect(target.id);
        if (rect) {
            tx = Math.max(rect.left, Math.min(transform.x, rect.right));
            ty = Math.max(rect.bottom, Math.min(transform.y, rect.top));
        }
    }

    const dx = tx - transform.x;
    const dy = ty - transform.y;
    const distSq = dx*dx + dy*dy;

    return distSq <= (this.range * this.range) ? NodeState.SUCCESS : NodeState.FAILURE;
  }
}
