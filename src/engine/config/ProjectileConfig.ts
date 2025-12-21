import { WEAPONS } from './defs/Weapons';

export interface LegacyProjectileDef {
  geometry: string;
  color: [number, number, number];
  scale: [number, number, number];
  spinSpeed: number;  
  pulseSpeed: number; 
  faceVelocity: boolean; 
}

const parseHexTuple = (hex: string): [number, number, number] => {
    const c = parseInt(hex.replace('#', ''), 16);
    return [
        ((c >> 16) & 255) / 255, 
        ((c >> 8) & 255) / 255, 
        (c & 255) / 255
    ];
};

export const PROJECTILE_CONFIG: Record<string, LegacyProjectileDef> = {};

Object.values(WEAPONS).forEach(def => {
    PROJECTILE_CONFIG[def.id] = {
        geometry: def.visual.model,
        color: parseHexTuple(def.visual.color),
        scale: def.visual.scale,
        spinSpeed: def.behavior?.spinSpeed || 0,
        pulseSpeed: def.behavior?.pulseSpeed || 0,
        faceVelocity: def.behavior?.faceVelocity ?? true
    };
});
