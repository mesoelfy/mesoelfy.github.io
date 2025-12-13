/**
 * AUDIO MATH LIBRARY
 * Single source of truth for DSP conversions (0.0-1.0 UI values -> Audio Parameters).
 * Ensures Settings Labels always match the Audio Engine exactly.
 */

// 1. FILTER (Density)
// Mapping: 0.0-1.0 -> 30Hz - 3000Hz (Logarithmic)
// Center (0.5) = 300Hz (RESTORED ORIGINAL VALUE)
export const getAmbienceFilterHz = (val: number): number => {
  return 300 * Math.pow(10, (val - 0.5) * 2);
};

// 2. PAN SPEED (Circulation)
// Mapping: 0.0-1.0 -> 0.005Hz - 0.5Hz
// Center (0.5) = 0.05Hz (20s cycle)
export const getAmbiencePanFreq = (val: number): number => {
  return 0.05 * Math.pow(10, (val - 0.5) * 2);
};

// 3. MOD SPEED (Fluctuation)
// Mapping: 0.0-1.0 -> 0.02Hz - 2.0Hz
// Center (0.5) = 0.2Hz (5s cycle)
export const getAmbienceModFreq = (val: number): number => {
  return 0.2 * Math.pow(10, (val - 0.5) * 2);
};

// 4. MOD DEPTH (Instability)
// Mapping: 0.0-1.0 -> +/- 1Hz - +/- 100Hz
// Center (0.5) = +/- 10Hz
export const getAmbienceModDepth = (val: number): number => {
  return 10 * Math.pow(10, (val - 0.5) * 2);
};

// 5. STEREO WIDTH
// Mapping: 0.0-1.0 -> Gain 0.0 - 0.8 (Cubic curve for natural feel)
export const getAmbienceStereoGain = (val: number): number => {
  return Math.pow(val, 3) * 0.8;
};
