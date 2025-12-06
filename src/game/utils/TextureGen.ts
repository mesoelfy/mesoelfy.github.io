import * as THREE from 'three';

// Helper: Exponential Falloff for natural light
// x is 0..1 (distance from center)
const falloff = (x: number, power: number = 2) => {
  return Math.pow(Math.max(0, 1 - x), power);
};

// 1. High Quality Comet Trail
export const createCometTexture = () => {
  const w = 64;
  const h = 256; // Higher resolution vertical
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  
  ctx.clearRect(0, 0, w, h);

  // We draw manually pixel-by-pixel or using complex gradients for better control
  // Gradient: Bottom (Head) -> Top (Tail)
  const gradient = ctx.createLinearGradient(0, h, 0, 0);
  
  // Exponential fade:
  // 0.0 (Head): 100% Opacity
  // 0.2 (Body): 60% Opacity
  // 1.0 (Tail): 0% Opacity
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)'); 
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;

  // Shape: Tapered Triangle
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h);       // Bottom Left (pinched slightly)
  ctx.lineTo(w * 0.9, h);       // Bottom Right
  ctx.lineTo(w * 0.5, 0);       // Top Tip
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

// 2. Player Bullet (Glowing Bar)
export const createGlowingBarTexture = () => {
  const w = 64;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Clear
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, w, h);

  // Glow (Soft Rect)
  const cx = w / 2;
  const cy = h / 2;
  
  // Radial glow around the bar isn't ideal, let's use shadow blur
  ctx.shadowColor = "white";
  ctx.shadowBlur = 20;
  ctx.fillStyle = "white";
  
  // Draw Core (Slim Rectangle)
  // Leave padding for the glow/shadow to bleed
  ctx.fillRect(24, 20, 16, 88); 

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

// 3. Hunter Orb (Exponential Glow)
export const createExponentialBallTexture = () => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2;

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  
  // Sharp Core, Soft Bloom
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.9)'); // Solid Core
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)'); // Mid Bloom
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Fade out

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

// 4. Soft Glow (Backgrounds - Legacy/Enemies)
export const createGlowTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};
