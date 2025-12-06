// Simple 1D Gradient Noise
// Returns value between -1 and 1 based on input 'x'
export function noise(x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3.0 - 2.0 * f); // Cubic smoothing
  return mix(hash(i), hash(i + 1), u);
}

function hash(n: number): number {
  return (Math.sin(n) * 43758.5453) % 1.0;
}

function mix(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t;
}
