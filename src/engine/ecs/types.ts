export type EntityID = number & { __brand: 'EntityID' };

export const createEntityID = (id: number): EntityID => id as EntityID;

export enum Tag {
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY',
  PROJECTILE = 'PROJECTILE', // RENAMED
  PARTICLE = 'PARTICLE',
  OBSTACLE = 'OBSTACLE',
  WORLD = 'WORLD' 
}

export enum Faction {
  FRIENDLY = 'FRIENDLY',
  HOSTILE = 'HOSTILE'
}

export enum ParticleShape {
  CIRCLE = 0,
  SQUARE = 1
}
