export type EntityID = number & { __brand: 'EntityID' };

export const createEntityID = (id: number): EntityID => id as EntityID;

export enum Tag {
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY',
  BULLET = 'BULLET',
  PARTICLE = 'PARTICLE',
  OBSTACLE = 'OBSTACLE',
  WORLD = 'WORLD' 
}

export enum Faction {
  FRIENDLY = 'FRIENDLY',
  HOSTILE = 'HOSTILE'
}
