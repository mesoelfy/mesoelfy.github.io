export const GAMEPLAY_CONFIG = {
  INTERACTION: {
    REPAIR_RATE: 0.05,
    QUERY_RADIUS: 1.0,
    REPAIR_HEAL_AMOUNT: 3.25,
    REBOOT_TICK_AMOUNT: 4.6
  },
  WEAPON: {
    // Exact Match: Chevron Radius (0.82) + Chevron Height (0.08) = 0.90
    MUZZLE_OFFSET: 0.90
  },
  STRUCTURE: {
    DECAY_INTERVAL: 0.1,
    DECAY_AMOUNT: 2.0
  }
} as const;
