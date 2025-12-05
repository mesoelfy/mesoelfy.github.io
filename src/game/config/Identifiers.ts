import { GameEvents as NewGameEvents } from '../events/GameEvents';

export const EnemyTypes = {
  MUNCHER: 'muncher',
  KAMIKAZE: 'kamikaze',
  HUNTER: 'hunter',
} as const;

export type EnemyType = typeof EnemyTypes[keyof typeof EnemyTypes];

// Re-export the new Enum as the old Const Object to maintain backward compatibility
export const GameEvents = NewGameEvents;
