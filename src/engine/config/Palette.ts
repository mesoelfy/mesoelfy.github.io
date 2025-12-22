export const PALETTE = {
  // Core Identity
  GREEN: {
    PRIMARY: '#78F654',
    DIM: '#1bb930',
    DARK: '#217e10',
    GLOW: '#C2FE9A',
    PURE: '#00FF41',    // World Safe State
    TERMINAL: '#00FF00' // Ascii Matrix
  },
  PURPLE: {
    PRIMARY: '#9E4EA5',
    LIGHT: '#BC86BA',
    DEEP: '#350E3A',
    DIM: '#822B8A'
  },
  // Service Pink (Core System)
  PINK: {
    PRIMARY: '#FFCCFF',
    DIM: '#C21CC2',
    DEEP: '#600B60'
  },
  RED: {
    CRITICAL: '#FF003C',
    DIM: '#800010',
    LIGHT: '#FF4D6D'
  },
  YELLOW: {
    ALERT: '#eae747',
    SOFT: '#F7D277',
    GOLD: '#FFD700', // World Warning
    DIM: '#5e4b00',  // Crystal Emissive
    ORANGE: '#FF8C00'
  },
  CYAN: {
    PRIMARY: '#00F0FF',
    DIM: '#008ba3',
    PURE: '#00FFFF' // World Sandbox
  },
  MONO: {
    BLACK: '#050505',
    WHITE: '#FFFFFF',
    GRAY: '#27282A'
  }
} as const;

// Collections for Procedural Generation
export const COLOR_SETS = {
  PURPLE: [PALETTE.PURPLE.PRIMARY, '#D0A3D8', '#E0B0FF', '#7A2F8F', '#B57EDC'],
  PINK:   [PALETTE.PINK.PRIMARY, PALETTE.PINK.DIM, '#FFB6FF', '#E0B0FF'],
  YELLOW: [PALETTE.YELLOW.SOFT, '#FFE5A0', '#FFA500', PALETTE.MONO.WHITE],
  RED:    [PALETTE.RED.CRITICAL, PALETTE.RED.LIGHT, PALETTE.RED.DIM],
  CYAN:   [PALETTE.CYAN.PRIMARY, PALETTE.CYAN.DIM, PALETTE.MONO.WHITE],
  WHITE:  [PALETTE.MONO.WHITE]
};
