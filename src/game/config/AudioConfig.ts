export type SoundType = 'oscillator' | 'noise';

export interface SoundRecipe {
  type: SoundType;
  wave?: OscillatorType; // 'sine', 'square', 'sawtooth', 'triangle'
  frequency: [number, number]; // [Start, End] in Hz
  duration: number; // Seconds
  volume: number; // Base volume (0.0 - 1.0)
  pitchVariance: number; // Random detune range in cents
  filter?: [number, number]; // [Start, End] Cutoff Hz (for Noise)
  
  // --- NEW CAPABILITIES ---
  distortion?: number; // 0 to 100+ (Amount of grit)
  fm?: {
    modFreq: number; // Frequency of the modulator
    modIndex: number; // Intensity of the modulation (The "Grit" factor)
    modType: OscillatorType;
  };
}

export const AUDIO_CONFIG: Record<string, SoundRecipe> = {
  // PLAYER
  'laser': {
    type: 'oscillator',
    wave: 'sawtooth',
    frequency: [880, 110], // Drop pitch
    duration: 0.15,
    volume: 0.15,
    pitchVariance: 100
  },
  
  // ENEMIES
  'enemy_fire': {
    type: 'oscillator',
    wave: 'square',
    frequency: [440, 220],
    duration: 0.2,
    volume: 0.15,
    pitchVariance: 50
  },
  
  // --- UPDATED DRILLER (FM SYNTHESIS) ---
  'driller_drill': {
    type: 'oscillator',
    wave: 'triangle', // Carrier
    frequency: [100, 80], // Low rumble
    duration: 1.5, // Longer loopable segment
    volume: 0.3,
    pitchVariance: 50,
    fm: {
      modType: 'square', // Gritty modulator
      modFreq: 60,       // Fast vibration
      modIndex: 500      // High index = Metal grinding sound
    }
  },
  
  // EXPLOSIONS
  'explosion_small': {
    type: 'noise',
    frequency: [0, 0], 
    filter: [1000, 100], 
    duration: 0.4,
    volume: 0.3,
    pitchVariance: 200,
    distortion: 20 // Added grit
  },
  'explosion_large': {
    type: 'noise',
    frequency: [0, 0],
    filter: [600, 50],
    duration: 1.5,
    volume: 0.5,
    pitchVariance: 0,
    distortion: 50 // Heavy crunch
  },
  
  // UI & FEEDBACK
  'click': {
    type: 'oscillator',
    wave: 'square',
    frequency: [400, 400],
    duration: 0.05,
    volume: 0.1,
    pitchVariance: 0
  },
  'hover': {
    type: 'oscillator',
    wave: 'sine',
    frequency: [800, 800],
    duration: 0.03,
    volume: 0.05,
    pitchVariance: 50
  },
  'heal': {
    type: 'oscillator',
    wave: 'sine',
    frequency: [300, 600],
    duration: 0.2,
    volume: 0.1,
    pitchVariance: 0
  },
  'powerup': {
    type: 'oscillator',
    wave: 'triangle',
    frequency: [440, 880],
    duration: 0.4,
    volume: 0.2,
    pitchVariance: 0
  },
  
  // --- NEW: REBOOT TICK (DISTORTION) ---
  'reboot_tick': {
    type: 'oscillator',
    wave: 'sawtooth',
    frequency: [60, 40], // Low voltage hum
    duration: 0.1,
    volume: 0.3,
    pitchVariance: 20,
    distortion: 400 // Extreme clipping -> "Zap" sound
  }
};
