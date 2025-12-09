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

  // --- ENEMIES & COMBAT ---
  'enemy_fire': { type: 'oscillator', wave: 'square', frequency: [440, 220], duration: 0.2, volume: 0.15, pitchVariance: 50 },
  
  // UPDATED: Modified Variant G (Short, No Tremolo, Punchy Drop-off)
  'driller_drill': { 
    type: 'noise', 
    frequency: [0,0], 
    filter: [300, 50], // Muffled impact
    duration: 0.25,    // Short for looping
    volume: 0.5, 
    pitchVariance: 50, 
    distortion: 60 
  },

  'explosion_small': { type: 'noise', frequency: [0, 0], filter: [1000, 100], duration: 0.4, volume: 0.3, pitchVariance: 200, distortion: 20 },
  'explosion_large': { type: 'noise', frequency: [0, 0], filter: [600, 50], duration: 1.5, volume: 0.5, pitchVariance: 0, distortion: 50 },

  // --- GAMEPLAY STATES (From Tests) ---
  
  // VARIANT F (Sub-Bass Throbbing) -> Low System Integrity Warning
  'warning_heartbeat': { 
    type: 'oscillator', 
    wave: 'sine', 
    frequency: [50, 50], 
    duration: 0.8, // Slightly longer pulse
    volume: 0.8, 
    pitchVariance: 0, 
    fm: { modType: 'sine', modFreq: 10, modIndex: 50 } 
  },

  // VARIANT K (Violent Chopper) -> Player Down (0% HP)
  'player_down_glitch': { 
    type: 'noise', 
    frequency: [0,0], 
    filter: [500, 500], 
    duration: 2.0, 
    volume: 0.6, 
    pitchVariance: 0, 
    distortion: 200, 
    tremolo: { rate: 12, depth: 1.0, wave: 'square' } // Sped up slightly
  },

  // --- BENCH: REMAINING DRILLER TESTS ---
  'drill_a': { type: 'oscillator', wave: 'sawtooth', frequency: [800, 1200], duration: 0.5, volume: 0.15, pitchVariance: 50, fm: { modType: 'sine', modFreq: 150, modIndex: 300 } },
  'drill_b': { type: 'oscillator', wave: 'square', frequency: [25, 20], duration: 0.4, volume: 0.4, pitchVariance: 0, distortion: 50 },
  'drill_c': { type: 'oscillator', wave: 'triangle', frequency: [150, 100], duration: 0.6, volume: 0.3, pitchVariance: 20, fm: { modType: 'square', modFreq: 57, modIndex: 1000 } },
  'drill_d': { type: 'oscillator', wave: 'sawtooth', frequency: [400, 50], duration: 0.3, volume: 0.3, pitchVariance: 50, distortion: 100 },
  'drill_e': { type: 'noise', frequency: [0, 0], filter: [800, 2000], duration: 0.4, volume: 0.3, pitchVariance: 0, distortion: 400 },
  
  // (F is now warning_heartbeat)
  // (G is now driller_drill)
  
  'drill_h': { type: 'noise', frequency: [0,0], filter: [1500, 800], duration: 3.0, volume: 0.3, pitchVariance: 0, distortion: 10, tremolo: { rate: 12, depth: 1.0, wave: 'sawtooth' } },
  'drill_i': { type: 'noise', frequency: [0,0], filter: [800, 400], duration: 3.0, volume: 0.4, pitchVariance: 0, distortion: 100, tremolo: { rate: 6, depth: 0.6, wave: 'square' } },
  'drill_j': { type: 'noise', frequency: [0,0], filter: [100, 1000], duration: 3.0, volume: 0.4, pitchVariance: 0, distortion: 20, tremolo: { rate: 15, depth: 0.5, wave: 'sine' } },
  
  // (K is now player_down_glitch)
  
  'drill_l': { type: 'noise', frequency: [0,0], filter: [80, 40], duration: 3.0, volume: 0.8, pitchVariance: 0, distortion: 20, tremolo: { rate: 0.5, depth: 0.9, wave: 'sine' } },

  // --- BENCH: PROTOTYPES ---
  'proto_charge_a': { type: 'oscillator', wave: 'sine', frequency: [200, 400], duration: 1.0, volume: 0.3, pitchVariance: 0 },
  'proto_charge_b': { type: 'oscillator', wave: 'sawtooth', frequency: [100, 800], duration: 1.0, volume: 0.2, pitchVariance: 0, fm: { modType: 'sine', modFreq: 50, modIndex: 200 } },
  'proto_charge_c': { type: 'oscillator', wave: 'square', frequency: [60, 60], duration: 1.0, volume: 0.2, pitchVariance: 0, fm: { modType: 'triangle', modFreq: 15, modIndex: 100 } },

  'proto_wave_a': { type: 'oscillator', wave: 'sine', frequency: [60, 20], duration: 2.5, volume: 0.6, pitchVariance: 0, distortion: 20 },
  'proto_wave_b': { type: 'oscillator', wave: 'square', frequency: [400, 350], duration: 1.0, volume: 0.3, pitchVariance: 0, fm: { modType: 'square', modFreq: 8, modIndex: 50 } },
  'proto_wave_c': { type: 'noise', frequency: [0, 0], filter: [2000, 200], duration: 1.5, volume: 0.4, pitchVariance: 0, distortion: 100 },

  'proto_lowhp_a': { type: 'oscillator', wave: 'triangle', frequency: [100, 50], duration: 0.15, volume: 0.4, pitchVariance: 0, distortion: 10 },
  'proto_lowhp_b': { type: 'oscillator', wave: 'sine', frequency: [2000, 2000], duration: 0.1, volume: 0.1, pitchVariance: 0 },
  'proto_lowhp_c': { type: 'noise', frequency: [0, 0], filter: [500, 100], duration: 0.2, volume: 0.2, pitchVariance: 0, distortion: 50 },

  'misc_teleport': { type: 'oscillator', wave: 'sine', frequency: [100, 1500], duration: 0.3, volume: 0.2, pitchVariance: 0 },
  'misc_denied': { type: 'oscillator', wave: 'sawtooth', frequency: [150, 50], duration: 0.2, volume: 0.2, pitchVariance: 0, distortion: 50 },
  'misc_ui_open': { type: 'oscillator', wave: 'triangle', frequency: [400, 600], duration: 0.1, volume: 0.1, pitchVariance: 0 },
};
