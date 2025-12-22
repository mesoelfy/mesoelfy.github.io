import { PALETTE } from '@/engine/config/Palette';

export const GAME_THEME = {
  turret: {
    base: PALETTE.GREEN.PRIMARY,
    glow: PALETTE.GREEN.GLOW,
    repair: PALETTE.PINK.PRIMARY,
  },
  bullet: {
    plasma: PALETTE.MONO.WHITE,
    trail: PALETTE.GREEN.PRIMARY,
    hunter: PALETTE.ORANGE.PRIMARY, // Updated to Rust
  },
  enemy: {
    muncher: PALETTE.PURPLE.INDIGO, // Updated to Indigo
    kamikaze: PALETTE.RED.CRITICAL,
    hunter: PALETTE.ORANGE.PRIMARY, // Updated to Rust
    charge: PALETTE.MONO.WHITE,  
  },
  hud: {
    text: PALETTE.GREEN.PRIMARY,
    warning: PALETTE.RED.CRITICAL,
  },
  vfx: {
    spark: PALETTE.MONO.WHITE,
    damage: PALETTE.RED.CRITICAL,
    heal: PALETTE.PINK.PRIMARY,
    clash: PALETTE.YELLOW.SOFT,
  }
};
