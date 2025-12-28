import { GameEvents as Events } from '@/engine/signals/GameEvents';

export const EnemyTypes = {
  DRILLER: 'driller',
  KAMIKAZE: 'kamikaze',
  HUNTER: 'hunter',
  DAEMON: 'daemon',
} as const;

export const WeaponIDs = {
  // --- NEW CORE WEAPONS ---
  PLAYER_RAILGUN: 'PLAYER_RAILGUN',
  PLAYER_SNIFFER: 'PLAYER_SNIFFER',
  PLAYER_PURGE: 'PLAYER_PURGE', // Zen Bomb

  // --- DEPRECATED / LEGACY ---
  PLAYER_STANDARD: 'PLAYER_STANDARD',
  PLAYER_FORK: 'PLAYER_FORK',
  PLAYER_BACKDOOR: 'PLAYER_BACKDOOR',
  
  // --- ENEMY WEAPONS ---
  ENEMY_HUNTER: 'ENEMY_HUNTER',
  DAEMON_ORB: 'DAEMON_ORB',
} as const;

export const ArchetypeIDs = {
  PLAYER: 'PLAYER',
  
  // Expand Flattened Types
  ...EnemyTypes,
  ...WeaponIDs,

  // Legacy/Generic Fallbacks (Mapped in Spawner)
  BULLET_PLAYER: 'BULLET_PLAYER',
  BULLET_ENEMY: 'BULLET_ENEMY',
} as const;

export type EnemyType = typeof EnemyTypes[keyof typeof EnemyTypes];
export type WeaponID = typeof WeaponIDs[keyof typeof WeaponIDs];
export type ArchetypeID = typeof ArchetypeIDs[keyof typeof ArchetypeIDs];

// Direct re-export for cleaner imports
export const GameEvents = Events;
