import { Entity } from '@/engine/ecs/Entity';

export interface CombatContext {
  damagePlayer: (amount: number) => void;
  destroyEntity: (entity: Entity, fx?: string) => void;
  spawnFX: (type: string, x: number, y: number) => void;
  playAudio: (key: string) => void;
  playSpatialAudio: (key: string, x: number) => void; // NEW
  addTrauma: (amount: number) => void;
}

export type CollisionHandler = (entityA: Entity, entityB: Entity, ctx: CombatContext) => void;
