export interface AIBlackboard {
  chargeProgress?: number;
  shieldHP?: number;
  lastFireTime?: number;
  wasHit?: boolean;
  driftX?: number;
  driftY?: number;
  drillTarget?: { 
      x: number; 
      y: number; 
      angle: number; 
      panelId: string;
  };
  spawnOriginX?: number;
  spawnOriginY?: number;
  spinVel?: number;
  roamTargetX?: number;
  roamTargetY?: number;
  chargingProjectileId?: number; // New field for Hunter charge
}
