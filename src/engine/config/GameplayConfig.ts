export const GAMEPLAY_CONFIG = {
  INTERACTION: {
    REPAIR_RATE: 0.05,
    QUERY_RADIUS: 1.0,
    REPAIR_HEAL_AMOUNT: 3.6, // Fast for panels
    SELF_HEAL_AMOUNT: 0.2,   // Slow for player (Creates tension)
    REBOOT_TICK_AMOUNT: 5.1  // Revive speed
  },
  WEAPON: {
    MUZZLE_OFFSET: 0.92
  },
  STRUCTURE: {
    DECAY_INTERVAL: 0.1,
    DECAY_AMOUNT: 2.0
  }
} as const;
