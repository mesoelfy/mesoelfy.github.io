import { Entity } from '../../core/ecs/Entity';

export interface CombatContext {
  damagePlayer: (amount: number) => void;
  destroyEntity: (entity: Entity, fx?: string) => void;
  spawnFX: (type: string, x: number, y: number) => void;
  playAudio: (key: string) => void;
  addTrauma: (amount: number) => void; // NEW: Direct shake control
}

export type CollisionHandler = (entityA: Entity, entityB: Entity, ctx: CombatContext) => void;
