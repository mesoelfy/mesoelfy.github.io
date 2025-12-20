export const GAMEPLAY_CONFIG = {
  INTERACTION: {
    REPAIR_RATE: 0.05,
    QUERY_RADIUS: 1.0,
    // Increased by ~15% (Was 2.8 -> 3.25)
    REPAIR_HEAL_AMOUNT: 3.25,
    // Increased by ~15% (Was 4.0 -> 4.6)
    REBOOT_TICK_AMOUNT: 4.6
  },
  WEAPON: {
    MUZZLE_OFFSET: 1.2
  },
  STRUCTURE: {
    DECAY_INTERVAL: 0.1,
    DECAY_AMOUNT: 2.0
  }
} as const;
