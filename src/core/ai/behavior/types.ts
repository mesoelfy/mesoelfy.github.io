import { Entity } from '@/core/ecs/Entity';
import { AIContext } from '@/game/handlers/ai/types';

export enum NodeState {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  RUNNING = 'RUNNING'
}

export abstract class BTNode {
  abstract tick(entity: Entity, context: AIContext): NodeState;
}
