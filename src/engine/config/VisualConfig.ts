export const VISUAL_CONFIG = {
  SHAKE: {
    DECAY_RATE: 2.0,
    MAX_OFFSET_X: 0.2,
    MAX_OFFSET_Y: 0.12,
    MAX_ROTATION: 0.015,
    BASE_SPEED: 15.0,
    TRAUMA_SPEED_BOOST: 65.0,
    PIXELS_PER_UNIT: 40
  },
  RENDER: {
    FLASH_DECAY: 6.0,
    SHUDDER_DECAY: 15.0,
    FLASH_COLOR: { r: 4.0, g: 0.0, b: 0.2 }
  },
  DEFORMATION: {
    STRETCH_FACTOR: 0.005,
    SQUASH_FACTOR: 0.002,
    MAX_STRETCH: 1.1,
    MIN_SQUASH: 0.95,
    SPAWN_Y_OFFSET: 3.5,
    
    // High Elasticity (Bullets)
    // TUNING: Increased base stretch from 0.04 to 0.06 for better visuals at lower speeds
    BASE_STRETCH: 0.06, 
    BASE_SQUASH: 0.03,
    MAX_STRETCH_CAP: 4.0,
    MIN_SQUASH_CAP: 0.4
  }
} as const;
