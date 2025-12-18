export const CollisionLayers = {
  NONE: 0,
  PLAYER: 1,
  ENEMY: 2,
  PLAYER_PROJECTILE: 4,
  ENEMY_PROJECTILE: 8,
  PANEL: 16,
  PICKUP: 32
} as const;

export const PhysicsConfig = {
  HITBOX: {
    PLAYER: 0.6,
    DRILLER: 0.4, // Reduced (was 0.5)
    KAMIKAZE: 0.7, // Increased (was 0.6)
    HUNTER: 0.74, 
    BULLET: 0.25,
    HUNTER_BULLET: 0.4
  },
  MASKS: {
    PLAYER: 42,
    ENEMY: 5,
    PLAYER_PROJECTILE: 10,
    ENEMY_PROJECTILE: 1
  }
};
