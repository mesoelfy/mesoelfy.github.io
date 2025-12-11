import { Entity } from '../../core/ecs/Entity';

export interface CombatContext {
  damagePlayer: (amount: number) => void;
  destroyEntity: (entity: Entity, fx?: string) => void;
  spawnFX: (type: string, x: number, y: number) => void; // Implemented via FastBus
  playAudio: (key: string) => void;
}

export type CollisionHandler = (entityA: Entity, entityB: Entity, ctx: CombatContext) => void;
