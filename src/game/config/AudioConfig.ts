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
  // ==========================================
  // UI & INTERFACE
  // ==========================================
  'ui_click': { type: 'oscillator', wave: 'square', frequency: [400, 400], duration: 0.05, volume: 0.1, pitchVariance: 0 },
  'ui_hover': { type: 'oscillator', wave: 'sine', frequency: [800, 800], duration: 0.03, volume: 0.05, pitchVariance: 50 },
  'ui_menu_open': { type: 'oscillator', wave: 'sine', frequency: [440, 660], duration: 0.15, volume: 0.1, pitchVariance: 0, attack: 0.02 },
  'ui_menu_close': { type: 'oscillator', wave: 'sine', frequency: [660, 440], duration: 0.15, volume: 0.1, pitchVariance: 0, attack: 0.02 },
  'ui_optimal': { type: 'oscillator', wave: 'sine', frequency: [1200, 1200], duration: 0.4, volume: 0.15, pitchVariance: 0, attack: 0.01 },
  'ui_error': { type: 'oscillator', wave: 'sawtooth', frequency: [150, 50], duration: 0.2, volume: 0.2, pitchVariance: 0, distortion: 50 },
  'ui_chirp': { type: 'oscillator', wave: 'triangle', frequency: [400, 600], duration: 0.1, volume: 0.1, pitchVariance: 0 },

  // ==========================================
  // GAMEPLAY FX (ONE SHOT)
  // ==========================================
  'fx_player_fire': { type: 'oscillator', wave: 'sawtooth', frequency: [880, 110], duration: 0.15, volume: 0.15, pitchVariance: 100 },
  'fx_enemy_fire': { type: 'oscillator', wave: 'square', frequency: [440, 220], duration: 0.2, volume: 0.15, pitchVariance: 50 },
  'fx_impact_light': { type: 'noise', frequency: [0, 0], filter: [1000, 100], duration: 0.4, volume: 0.3, pitchVariance: 200, distortion: 20 },
  'fx_impact_heavy': { type: 'noise', frequency: [0, 0], filter: [600, 50], duration: 1.5, volume: 0.5, pitchVariance: 0, distortion: 50 },
  'fx_boot_sequence': { type: 'noise', frequency: [0, 0], filter: [1500, 50], duration: 2.0, volume: 0.6, pitchVariance: 0, distortion: 30 },
  'fx_player_death': { type: 'noise', frequency: [0,0], filter: [500, 500], duration: 2.0, volume: 0.6, pitchVariance: 0, distortion: 200, tremolo: { rate: 12, depth: 1.0, wave: 'square' } },
  'fx_level_up': { type: 'oscillator', wave: 'triangle', frequency: [440, 880], duration: 0.4, volume: 0.2, pitchVariance: 0 },
  'fx_reboot_success': { type: 'oscillator', wave: 'triangle', frequency: [440, 880], duration: 0.3, volume: 0.3, pitchVariance: 0, attack: 0.01, tremolo: { rate: 10, depth: 1.0, wave: 'square' } },
  'fx_teleport': { type: 'oscillator', wave: 'sine', frequency: [100, 1500], duration: 0.3, volume: 0.2, pitchVariance: 0 },

  // ==========================================
  // LOOPS & STATES (CONTINUOUS)
  // ==========================================
  'loop_heal': { type: 'oscillator', wave: 'sine', frequency: [300, 600], duration: 0.2, volume: 0.1, pitchVariance: 0 },
  'loop_reboot': { type: 'oscillator', wave: 'sine', frequency: [100, 200], duration: 0.2, volume: 0.2, pitchVariance: 0 },
  'loop_warning': { type: 'oscillator', wave: 'sine', frequency: [55, 55], duration: 0.8, volume: 0.7, pitchVariance: 0, attack: 0.03, fm: { modType: 'sine', modFreq: 10, modIndex: 25 } },
  'loop_drill': { type: 'noise', frequency: [0,0], filter: [300, 50], duration: 0.25, volume: 0.5, pitchVariance: 50, distortion: 60 },

  // ==========================================
  // AMBIENCE
  // ==========================================
  // UPDATED: Volume increased from 0.05 to 0.24 (Natural Source Level)
  'ambience_core': { type: 'noise', frequency: [0,0], filter: [800, 800], duration: 40.0, volume: 0.24, pitchVariance: 0 },

  // ==========================================
  // SYNTHESIS LAB (RENAMED PROTOS)
  // ==========================================
  'syn_fm_scream': { type: 'oscillator', wave: 'sawtooth', frequency: [800, 1200], duration: 0.5, volume: 0.15, pitchVariance: 50, fm: { modType: 'sine', modFreq: 150, modIndex: 300 } },
  'syn_data_burst': { type: 'oscillator', wave: 'square', frequency: [25, 20], duration: 0.4, volume: 0.4, pitchVariance: 0, distortion: 50 },
  'syn_bass_drop': { type: 'oscillator', wave: 'triangle', frequency: [150, 100], duration: 0.6, volume: 0.3, pitchVariance: 20, fm: { modType: 'square', modFreq: 57, modIndex: 1000 } },
  'syn_alarm_chirp': { type: 'oscillator', wave: 'sawtooth', frequency: [400, 50], duration: 0.3, volume: 0.3, pitchVariance: 50, distortion: 100 },
  'syn_static_burst': { type: 'noise', frequency: [0, 0], filter: [800, 2000], duration: 0.4, volume: 0.3, pitchVariance: 0, distortion: 400 },
  'syn_wobble_bass': { type: 'oscillator', wave: 'sine', frequency: [50, 50], duration: 0.5, volume: 0.6, pitchVariance: 0, fm: { modType: 'sine', modFreq: 10, modIndex: 50 } },
  'syn_grind_loop': { type: 'noise', frequency: [0,0], filter: [200, 100], duration: 3.0, volume: 0.5, pitchVariance: 0, distortion: 50, tremolo: { rate: 2, depth: 0.8, wave: 'sine' } },
  'syn_insect_swarm': { type: 'noise', frequency: [0,0], filter: [1500, 800], duration: 3.0, volume: 0.3, pitchVariance: 0, distortion: 10, tremolo: { rate: 12, depth: 1.0, wave: 'sawtooth' } },
  'syn_interference': { type: 'noise', frequency: [0,0], filter: [800, 400], duration: 3.0, volume: 0.4, pitchVariance: 0, distortion: 100, tremolo: { rate: 6, depth: 0.6, wave: 'square' } },
  'syn_wind_howl': { type: 'noise', frequency: [0,0], filter: [100, 1000], duration: 3.0, volume: 0.4, pitchVariance: 0, distortion: 20, tremolo: { rate: 15, depth: 0.5, wave: 'sine' } },
  'syn_robot_chatter': { type: 'noise', frequency: [0,0], filter: [500, 500], duration: 3.0, volume: 0.5, pitchVariance: 0, distortion: 200, tremolo: { rate: 8, depth: 1.0, wave: 'square' } },
  'syn_deep_hum': { type: 'noise', frequency: [0,0], filter: [80, 40], duration: 3.0, volume: 0.8, pitchVariance: 0, distortion: 20, tremolo: { rate: 0.5, depth: 0.9, wave: 'sine' } },
  'syn_sine_rise': { type: 'oscillator', wave: 'sine', frequency: [200, 400], duration: 1.0, volume: 0.3, pitchVariance: 0 },
  'syn_saw_rise': { type: 'oscillator', wave: 'sawtooth', frequency: [100, 800], duration: 1.0, volume: 0.2, pitchVariance: 0, fm: { modType: 'sine', modFreq: 50, modIndex: 200 } },
  'syn_sqr_rise': { type: 'oscillator', wave: 'square', frequency: [60, 60], duration: 1.0, volume: 0.2, pitchVariance: 0, fm: { modType: 'triangle', modFreq: 15, modIndex: 100 } },
  'syn_siren_wail': { type: 'oscillator', wave: 'sine', frequency: [60, 20], duration: 2.5, volume: 0.6, pitchVariance: 0, distortion: 20 },
  'syn_alert_pulse': { type: 'oscillator', wave: 'square', frequency: [400, 350], duration: 1.0, volume: 0.3, pitchVariance: 0, fm: { modType: 'square', modFreq: 8, modIndex: 50 } },
  'syn_static_wash': { type: 'noise', frequency: [0, 0], filter: [2000, 200], duration: 1.5, volume: 0.4, pitchVariance: 0, distortion: 100 },
};
