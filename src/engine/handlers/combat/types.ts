import { Entity } from '@/engine/ecs/Entity';

export interface CombatContext {
  damagePlayer: (amount: number) => void;
  destroyEntity: (entity: Entity, fx?: string, impactAngle?: number) => void;
  spawnFX: (type: string, x: number, y: number) => void;
  // UPDATED: Added angle parameter (optional, defaults to 0)
  spawnImpact: (x: number, y: number, r: number, g: number, b: number, angle: number) => void;
  playAudio: (key: string) => void;
  playSpatialAudio: (key: string, x: number) => void;
  addTrauma: (amount: number) => void;
}

export type CollisionHandler = (entityA: Entity, entityB: Entity, ctx: CombatContext) => void;
