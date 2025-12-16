export const ProjectileGeometry = {
  SPHERE: 'SPHERE',
  CAPSULE: 'CAPSULE',
  DIAMOND: 'DIAMOND',
  PYRAMID: 'PYRAMID',
  RING: 'RING',
  ARROW: 'ARROW'
} as const;

export type GeometryType = keyof typeof ProjectileGeometry;

export interface ProjectileDef {
  geometry: GeometryType;
  color: [number, number, number];
  scale: [number, number, number];
  spinSpeed: number;  
  pulseSpeed: number; 
  faceVelocity: boolean; 
}

const neon = (hex: string, intensity: number): [number, number, number] => {
  const c = parseInt(hex.replace('#', ''), 16);
  const r = ((c >> 16) & 255) / 255;
  const g = ((c >> 8) & 255) / 255;
  const b = (c & 255) / 255;
  return [r * intensity, g * intensity, b * intensity];
};

export const PROJECTILE_CONFIG: Record<string, ProjectileDef> = {
  'PLAYER_STANDARD': {
    geometry: 'CAPSULE',
    color: neon('#78F654', 4.0),
    scale: [0.15, 0.6, 0.15],
    spinSpeed: 0, pulseSpeed: 0, faceVelocity: true
  },
  'PLAYER_FORK': {
    geometry: 'PYRAMID',
    color: neon('#F7D277', 3.0),
    scale: [0.4, 0.4, 0.4],
    spinSpeed: 5.0, pulseSpeed: 0, faceVelocity: true
  },
  'PLAYER_SNIFFER': {
    geometry: 'DIAMOND',
    color: neon('#00F0FF', 5.0),
    scale: [0.3, 0.3, 0.3],
    spinSpeed: 15.0, pulseSpeed: 0, faceVelocity: false
  },
  'PLAYER_BACKDOOR': {
    geometry: 'RING',
    color: neon('#FF4D6D', 3.0),
    scale: [0.4, 0.4, 0.4],
    spinSpeed: -2.0, pulseSpeed: 2.0, faceVelocity: false
  },
  'PLAYER_PURGE': {
    geometry: 'DIAMOND',
    color: [10, 10, 10],
    scale: [0.6, 0.6, 0.6],
    spinSpeed: 20.0, pulseSpeed: 0, faceVelocity: false
  },
  'ENEMY_HUNTER': {
    geometry: 'ARROW',
    color: neon('#FF8C00', 6.0),
    scale: [0.3, 1.0, 0.3],
    spinSpeed: 0, pulseSpeed: 0, faceVelocity: true
  },
  // CHANGED: Blue color (#0088FF)
  'DAEMON_ORB': {
    geometry: 'SPHERE',
    color: neon('#0088FF', 5.0), // Deep Neon Blue
    scale: [0.5, 0.5, 0.5],
    spinSpeed: 1.0, pulseSpeed: 4.0, faceVelocity: false
  }
};
