export const GAMEPLAY_CONFIG = {
  INTERACTION: {
    REPAIR_RATE: 0.05,
    QUERY_RADIUS: 1.0,
    REPAIR_HEAL_AMOUNT: 3.25,
    REBOOT_TICK_AMOUNT: 4.6
  },
  WEAPON: {
    // Updated: Matches new larger Chevron Tip Radius (0.92)
    MUZZLE_OFFSET: 0.92
  },
  STRUCTURE: {
    DECAY_INTERVAL: 0.1,
    DECAY_AMOUNT: 2.0
  }
} as const;
