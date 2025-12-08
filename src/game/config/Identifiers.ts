import { GameEvents as NewGameEvents } from '../events/GameEvents';

export const EnemyTypes = {
  DRILLER: 'driller',
  KAMIKAZE: 'kamikaze',
  HUNTER: 'hunter',
  DAEMON: 'daemon', // NEW
} as const;

export type EnemyType = typeof EnemyTypes[keyof typeof EnemyTypes];
export const GameEvents = NewGameEvents;
