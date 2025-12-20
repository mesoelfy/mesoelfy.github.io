export interface DaemonBlackboard {
  chargeProgress?: number;
  shieldHP?: number;
  lastFireTime?: number;
  wasHit?: boolean;
}

export interface HunterBlackboard {
  driftX?: number;
  driftY?: number;
}

export interface DrillerBlackboard {
  penetrationDepth?: number;
}

export type AIBlackboard = DaemonBlackboard & HunterBlackboard & DrillerBlackboard & Record<string, any>;
