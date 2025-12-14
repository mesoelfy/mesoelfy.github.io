// Nominal typing to prevent mixing up IDs with math numbers
export type EntityID = number & { __brand: 'EntityID' };

export const createEntityID = (id: number): EntityID => id as EntityID;

export enum Tag {
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY',
  BULLET = 'BULLET',
  PARTICLE = 'PARTICLE',
  OBSTACLE = 'OBSTACLE'
}
