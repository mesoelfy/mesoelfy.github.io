import { Entity } from '@/engine/ecs/Entity';

export interface CombatContext {
  damagePlayer: (amount: number) => void;
  // Updated: Accept optional impactAngle for directional spray
  destroyEntity: (entity: Entity, fx?: string, impactAngle?: number) => void;
  spawnFX: (type: string, x: number, y: number) => void;
  playAudio: (key: string) => void;
  playSpatialAudio: (key: string, x: number) => void;
  addTrauma: (amount: number) => void;
}

export type CollisionHandler = (entityA: Entity, entityB: Entity, ctx: CombatContext) => void;
