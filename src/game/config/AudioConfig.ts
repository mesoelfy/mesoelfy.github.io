export type SoundType = 'oscillator' | 'noise';

export interface SoundRecipe {
  type: SoundType;
  wave?: OscillatorType; // 'sine', 'square', 'sawtooth', 'triangle'
  frequency: [number, number]; // [Start, End] in Hz
  duration: number; // Seconds
  volume: number; // Base volume (0.0 - 1.0)
  pitchVariance: number; // Random detune range in cents (e.g., 100 = +/- 1 semitone)
  filter?: [number, number]; // [Start, End] Cutoff Hz (for Noise)
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
  
  // EXPLOSIONS
  'explosion_small': {
    type: 'noise',
    frequency: [0, 0], // Ignored for noise
    filter: [1000, 100], // Lowpass sweep
    duration: 0.4,
    volume: 0.3,
    pitchVariance: 200
  },
  'explosion_large': {
    type: 'noise',
    frequency: [0, 0],
    filter: [600, 50], // Deep rumble
    duration: 1.5,
    volume: 0.5,
    pitchVariance: 0
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
    frequency: [300, 600], // Rising chime
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
  }
};
