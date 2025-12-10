export type SoundType = 'oscillator' | 'noise';

export interface SoundRecipe {
  type: SoundType;
  wave?: OscillatorType; 
  frequency: [number, number]; 
  duration: number; 
  volume: number; 
  pitchVariance: number; 
  filter?: [number, number]; 
  distortion?: number; 
  attack?: number; 
  fm?: {
    modFreq: number; 
    modIndex: number; 
    modType: OscillatorType;
  };
  tremolo?: {
    rate: number; 
    depth: number; 
    wave?: OscillatorType;
  };
}

export const AUDIO_CONFIG: Record<string, SoundRecipe> = {
  // --- PLAYER & CORE ---
  'laser': { type: 'oscillator', wave: 'sawtooth', frequency: [880, 110], duration: 0.15, volume: 0.15, pitchVariance: 100 },
  'click': { type: 'oscillator', wave: 'square', frequency: [400, 400], duration: 0.05, volume: 0.1, pitchVariance: 0 },
  'hover': { type: 'oscillator', wave: 'sine', frequency: [800, 800], duration: 0.03, volume: 0.05, pitchVariance: 50 },
  'heal': { type: 'oscillator', wave: 'sine', frequency: [300, 600], duration: 0.2, volume: 0.1, pitchVariance: 0 },
  'powerup': { type: 'oscillator', wave: 'triangle', frequency: [440, 880], duration: 0.4, volume: 0.2, pitchVariance: 0 },
  'reboot_tick': { type: 'oscillator', wave: 'sawtooth', frequency: [60, 40], duration: 0.1, volume: 0.3, pitchVariance: 20, distortion: 400 },
  'initialize_impact': { type: 'noise', frequency: [0, 0], filter: [1500, 50], duration: 2.0, volume: 0.6, pitchVariance: 0, distortion: 30 },

  // --- UI / MENUS (NEW) ---
  'menu_open': { type: 'oscillator', wave: 'sine', frequency: [440, 660], duration: 0.15, volume: 0.1, pitchVariance: 0, attack: 0.02 },
  'menu_close': { type: 'oscillator', wave: 'sine', frequency: [660, 440], duration: 0.15, volume: 0.1, pitchVariance: 0, attack: 0.02 },

  // --- ENEMIES & COMBAT ---
  'enemy_fire': { type: 'oscillator', wave: 'square', frequency: [440, 220], duration: 0.2, volume: 0.15, pitchVariance: 50 },
  'driller_drill': { 
    type: 'noise', frequency: [0,0], filter: [300, 50], duration: 0.25, volume: 0.5, pitchVariance: 50, distortion: 60 
  },
  'explosion_small': { type: 'noise', frequency: [0, 0], filter: [1000, 100], duration: 0.4, volume: 0.3, pitchVariance: 200, distortion: 20 },
  'explosion_large': { type: 'noise', frequency: [0, 0], filter: [600, 50], duration: 1.5, volume: 0.5, pitchVariance: 0, distortion: 50 },

  // --- GAMEPLAY STATES ---
  'warning_heartbeat': { 
    type: 'oscillator', wave: 'sine', frequency: [55, 55], duration: 0.8, volume: 0.7, pitchVariance: 0, 
    attack: 0.03, fm: { modType: 'sine', modFreq: 10, modIndex: 25 } 
  },
  'player_down_glitch': { 
    type: 'noise', frequency: [0,0], filter: [500, 500], duration: 2.0, volume: 0.6, pitchVariance: 0, distortion: 200, 
    tremolo: { rate: 12, depth: 1.0, wave: 'square' } 
  },

  // --- AMBIENCE ---
  'ambience_b': { 
    type: 'noise', 
    frequency: [0,0], 
    filter: [800, 800], 
    duration: 40.0, 
    volume: 0.05,   
    pitchVariance: 0
  },

  // --- BENCH ---
  'ambience_a': { type: 'noise', frequency: [0,0], filter: [80, 80], duration: 5.0, volume: 0.25, pitchVariance: 0 },
  'ambience_c': { type: 'noise', frequency: [0,0], filter: [100, 100], duration: 5.0, volume: 0.3, pitchVariance: 0, tremolo: { rate: 0.2, depth: 0.4, wave: 'sine' } },

  // --- DRILLERS ---
  'drill_a': { type: 'oscillator', wave: 'sawtooth', frequency: [800, 1200], duration: 0.5, volume: 0.15, pitchVariance: 50, fm: { modType: 'sine', modFreq: 150, modIndex: 300 } },
  'drill_b': { type: 'oscillator', wave: 'square', frequency: [25, 20], duration: 0.4, volume: 0.4, pitchVariance: 0, distortion: 50 },
  'drill_c': { type: 'oscillator', wave: 'triangle', frequency: [150, 100], duration: 0.6, volume: 0.3, pitchVariance: 20, fm: { modType: 'square', modFreq: 57, modIndex: 1000 } },
  'drill_d': { type: 'oscillator', wave: 'sawtooth', frequency: [400, 50], duration: 0.3, volume: 0.3, pitchVariance: 50, distortion: 100 },
  'drill_e': { type: 'noise', frequency: [0, 0], filter: [800, 2000], duration: 0.4, volume: 0.3, pitchVariance: 0, distortion: 400 },
  'drill_f': { type: 'oscillator', wave: 'sine', frequency: [50, 50], duration: 0.5, volume: 0.6, pitchVariance: 0, fm: { modType: 'sine', modFreq: 10, modIndex: 50 } },
  'drill_g': { type: 'noise', frequency: [0,0], filter: [200, 100], duration: 3.0, volume: 0.5, pitchVariance: 0, distortion: 50, tremolo: { rate: 2, depth: 0.8, wave: 'sine' } },
  'drill_h': { type: 'noise', frequency: [0,0], filter: [1500, 800], duration: 3.0, volume: 0.3, pitchVariance: 0, distortion: 10, tremolo: { rate: 12, depth: 1.0, wave: 'sawtooth' } },
  'drill_i': { type: 'noise', frequency: [0,0], filter: [800, 400], duration: 3.0, volume: 0.4, pitchVariance: 0, distortion: 100, tremolo: { rate: 6, depth: 0.6, wave: 'square' } },
  'drill_j': { type: 'noise', frequency: [0,0], filter: [100, 1000], duration: 3.0, volume: 0.4, pitchVariance: 0, distortion: 20, tremolo: { rate: 15, depth: 0.5, wave: 'sine' } },
  'drill_k': { type: 'noise', frequency: [0,0], filter: [500, 500], duration: 3.0, volume: 0.5, pitchVariance: 0, distortion: 200, tremolo: { rate: 8, depth: 1.0, wave: 'square' } },
  'drill_l': { type: 'noise', frequency: [0,0], filter: [80, 40], duration: 3.0, volume: 0.8, pitchVariance: 0, distortion: 20, tremolo: { rate: 0.5, depth: 0.9, wave: 'sine' } },

  // --- MISC ---
  'proto_charge_a': { type: 'oscillator', wave: 'sine', frequency: [200, 400], duration: 1.0, volume: 0.3, pitchVariance: 0 },
  'proto_charge_b': { type: 'oscillator', wave: 'sawtooth', frequency: [100, 800], duration: 1.0, volume: 0.2, pitchVariance: 0, fm: { modType: 'sine', modFreq: 50, modIndex: 200 } },
  'proto_charge_c': { type: 'oscillator', wave: 'square', frequency: [60, 60], duration: 1.0, volume: 0.2, pitchVariance: 0, fm: { modType: 'triangle', modFreq: 15, modIndex: 100 } },
  'proto_wave_a': { type: 'oscillator', wave: 'sine', frequency: [60, 20], duration: 2.5, volume: 0.6, pitchVariance: 0, distortion: 20 },
  'proto_wave_b': { type: 'oscillator', wave: 'square', frequency: [400, 350], duration: 1.0, volume: 0.3, pitchVariance: 0, fm: { modType: 'square', modFreq: 8, modIndex: 50 } },
  'proto_wave_c': { type: 'noise', frequency: [0, 0], filter: [2000, 200], duration: 1.5, volume: 0.4, pitchVariance: 0, distortion: 100 },
  'misc_teleport': { type: 'oscillator', wave: 'sine', frequency: [100, 1500], duration: 0.3, volume: 0.2, pitchVariance: 0 },
  'misc_denied': { type: 'oscillator', wave: 'sawtooth', frequency: [150, 50], duration: 0.2, volume: 0.2, pitchVariance: 0, distortion: 50 },
  'misc_ui_open': { type: 'oscillator', wave: 'triangle', frequency: [400, 600], duration: 0.1, volume: 0.1, pitchVariance: 0 },
  'proto_lowhp_a': { type: 'oscillator', wave: 'sine', frequency: [50, 50], duration: 0.8, volume: 0.7, pitchVariance: 0, attack: 0.15, fm: { modType: 'sine', modFreq: 10, modIndex: 50 } },
  'proto_lowhp_b': { type: 'oscillator', wave: 'sine', frequency: [55, 55], duration: 0.8, volume: 0.7, pitchVariance: 0, attack: 0.08, fm: { modType: 'sine', modFreq: 10, modIndex: 25 } },
  'proto_lowhp_c': { type: 'oscillator', wave: 'triangle', frequency: [50, 40], duration: 0.8, volume: 0.7, pitchVariance: 0, attack: 0.08, filter: [150, 50] },
};
