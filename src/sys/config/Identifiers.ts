import { GameEvents as NewGameEvents } from '@/engine/signals/GameEvents';

export const EnemyTypes = {
  DRILLER: 'driller',
  KAMIKAZE: 'kamikaze',
  HUNTER: 'hunter',
  DAEMON: 'daemon',
} as const;

export const ArchetypeIDs = {
  PLAYER: 'PLAYER',
  BULLET_PLAYER: 'BULLET_PLAYER',
  BULLET_ENEMY: 'BULLET_ENEMY',
  ...EnemyTypes
} as const;

export type EnemyType = typeof EnemyTypes[keyof typeof EnemyTypes];
export type ArchetypeID = typeof ArchetypeIDs[keyof typeof ArchetypeIDs] | string;
export const GameEvents = NewGameEvents;
