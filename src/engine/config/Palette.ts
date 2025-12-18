export const PALETTE = {
  // Core Identity
  GREEN: {
    PRIMARY: '#78F654',
    DIM: '#1bb930',
    DARK: '#217e10',
    GLOW: '#C2FE9A'
  },
  PURPLE: {
    PRIMARY: '#9E4EA5',
    LIGHT: '#BC86BA',
    DEEP: '#350E3A',
    DIM: '#822B8A'
  },
  RED: {
    CRITICAL: '#FF003C',
    DIM: '#800010',
    LIGHT: '#FF4D6D'
  },
  YELLOW: {
    ALERT: '#eae747',
    SOFT: '#F7D277',
    ORANGE: '#FF8C00'
  },
  CYAN: {
    PRIMARY: '#00F0FF',
    DIM: '#008ba3'
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
  YELLOW: [PALETTE.YELLOW.SOFT, '#FFE5A0', '#FFA500', PALETTE.MONO.WHITE],
  RED:    [PALETTE.RED.CRITICAL, PALETTE.RED.LIGHT, PALETTE.RED.DIM],
  CYAN:   [PALETTE.CYAN.PRIMARY, PALETTE.CYAN.DIM, PALETTE.MONO.WHITE],
  WHITE:  [PALETTE.MONO.WHITE]
};
