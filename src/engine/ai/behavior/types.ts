import { Entity } from '@/engine/ecs/Entity';
import { AIContext } from '@/engine/handlers/ai/types';

export enum NodeState {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  RUNNING = 'RUNNING'
}

export abstract class BTNode {
  abstract tick(entity: Entity, context: AIContext): NodeState;
}
