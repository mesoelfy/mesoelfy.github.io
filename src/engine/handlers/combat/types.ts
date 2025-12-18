import { Entity } from '@/engine/ecs/Entity';

export interface CombatContext {
  damagePlayer: (amount: number) => void;
  destroyEntity: (entity: Entity, fx?: string, impactAngle?: number) => void;
  spawnFX: (type: string, x: number, y: number) => void;
  spawnImpact: (x: number, y: number, r: number, g: number, b: number, angle: number) => void;
  playAudio: (key: string) => void;
  playSpatialAudio: (key: string, x: number) => void;
  addTrauma: (amount: number) => void;
  // NEW: Flash visual support
  flashEntity: (id: number) => void;
}

export type CollisionHandler = (entityA: Entity, entityB: Entity, ctx: CombatContext) => void;
