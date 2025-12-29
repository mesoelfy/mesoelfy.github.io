import { GameEvents as Events } from '@/engine/signals/GameEvents';

export const EnemyTypes = {
  DRILLER: 'driller',
  KAMIKAZE: 'kamikaze',
  HUNTER: 'hunter',
  DAEMON: 'daemon',
} as const;

export const WeaponIDs = {
  // --- CORE WEAPONS ---
  PLAYER_SPITTER: 'PLAYER_SPITTER', // RENAMED FROM RAILGUN
  PLAYER_SNIFFER: 'PLAYER_SNIFFER',
  PLAYER_PURGE: 'PLAYER_PURGE', 
  
  // --- ENEMY WEAPONS ---
  ENEMY_HUNTER: 'ENEMY_HUNTER',
  DAEMON_ORB: 'DAEMON_ORB',
} as const;

export const ArchetypeIDs = {
  PLAYER: 'PLAYER',
  
  // Expand Flattened Types
  ...EnemyTypes,
  ...WeaponIDs,

  // Legacy/Generic Fallbacks
  BULLET_PLAYER: 'BULLET_PLAYER',
  BULLET_ENEMY: 'BULLET_ENEMY',
} as const;

export type EnemyType = typeof EnemyTypes[keyof typeof EnemyTypes];
export type WeaponID = typeof WeaponIDs[keyof typeof WeaponIDs];
export type ArchetypeID = typeof ArchetypeIDs[keyof typeof ArchetypeIDs];

export const GameEvents = Events;
