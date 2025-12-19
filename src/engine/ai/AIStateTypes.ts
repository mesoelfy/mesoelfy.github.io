export const AI_STATE = {
  IDLE: 'IDLE',
  SPAWN: 'SPAWN',
  ACTIVE: 'ACTIVE',
  ATTACK: 'ATTACK',
  ORBIT: 'ORBIT',
  CHARGING: 'CHARGING',
  READY: 'READY',
  COOLDOWN: 'COOLDOWN',
  REBOOTING: 'REBOOTING',
  HEALING: 'HEALING',
  FLIGHT: 'FLIGHT' // Projectiles
} as const;

export type AIBehaviorState = typeof AI_STATE[keyof typeof AI_STATE];
