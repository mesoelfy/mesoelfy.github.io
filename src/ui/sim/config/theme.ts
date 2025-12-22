import { PALETTE } from '@/engine/config/Palette';

export const GAME_THEME = {
  turret: {
    base: PALETTE.GREEN.PRIMARY,
    glow: PALETTE.GREEN.GLOW,
    repair: PALETTE.PINK.PRIMARY, // Updated to Pink
  },
  bullet: {
    plasma: PALETTE.MONO.WHITE,
    trail: PALETTE.GREEN.PRIMARY,
    hunter: PALETTE.YELLOW.SOFT, 
  },
  enemy: {
    muncher: PALETTE.PURPLE.PRIMARY,
    kamikaze: PALETTE.RED.CRITICAL,
    hunter: PALETTE.YELLOW.SOFT,
    charge: PALETTE.MONO.WHITE,  
  },
  hud: {
    text: PALETTE.GREEN.PRIMARY,
    warning: PALETTE.RED.CRITICAL,
  },
  vfx: {
    spark: PALETTE.MONO.WHITE,
    damage: PALETTE.RED.CRITICAL,
    heal: PALETTE.PINK.PRIMARY, // Updated to Pink
    clash: PALETTE.YELLOW.SOFT,
  }
};
