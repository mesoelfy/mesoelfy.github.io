/**
 * STRICT TYPING FOR AI MEMORY
 * Eliminates "Magic Strings" in logic handlers.
 */

export interface AIBlackboard {
  // --- DAEMON (Boss/Summon) ---
  chargeProgress?: number; // 0.0 to 1.0
  shieldHP?: number;       // Hit points for shield state
  lastFireTime?: number;   // Timestamp
  wasHit?: boolean;        // Reaction trigger

  // --- HUNTER (Ranged) ---
  driftX?: number;         // Hover target offset X
  driftY?: number;         // Hover target offset Y

  // --- DRILLER (Melee) ---
  // Locked coordinates for the drill attack
  drillTarget?: { 
      x: number; 
      y: number; 
      angle: number; 
      panelId: string;
  };

  // --- GENERAL / SHARED ---
  spawnOriginX?: number;   // For returning to post
  spawnOriginY?: number;
}
