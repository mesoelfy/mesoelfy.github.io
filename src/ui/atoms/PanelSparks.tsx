import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface PanelSparksProps {
  intensity?: 'normal' | 'extreme'; 
}

export const PanelSparks = ({ intensity }: PanelSparksProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handling
    if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    }

    let particles: Particle[] = [];
    let animationFrameId: number;

    const COLORS = ['#FF003C', '#CC0020', '#800010', '#FF4466'];
    
    // UPDATED: 500 Particles (Catastrophic Failure)
    const PARTICLE_COUNT = 500; 
    
    // 1. INITIAL SPAWN (ONE SHOT)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const edge = Math.floor(Math.random() * 3); // 0: Top, 1: Left, 2: Right
        let x = 0, y = 0, vx = 0, vy = 0;

        if (edge === 0) { // Top
            x = Math.random() * canvas.width;
            y = 0;
            vx = (Math.random() - 0.5) * 8;
            vy = (Math.random() * 5) + 2; // Down
        } else if (edge === 1) { // Left
            x = 0;
            y = Math.random() * (canvas.height * 0.5); 
            vx = (Math.random() * 5) + 2; // Right
            vy = (Math.random() * 5) - 2;
        } else { // Right
            x = canvas.width;
            y = Math.random() * (canvas.height * 0.5);
            vx = -((Math.random() * 5) + 2); // Left
            vy = (Math.random() * 5) - 2;
        }

        particles.push({
            x, y, vx, vy,
            life: 1.0,
            maxLife: 1.0,
            size: Math.random() * 3 + 1,
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
    }

    // 2. ANIMATION LOOP
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let activeParticles = false;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Physics
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // Gravity
        
        // Floor Bounce
        if (p.y > canvas.height) {
          p.y = canvas.height;
          p.vy *= -0.5; 
          p.vx *= 0.7;  
        }
        
        // Wall Bounce
        if (p.x < 0 || p.x > canvas.width) {
          p.vx *= -0.6;
          p.x = Math.max(0, Math.min(canvas.width, p.x));
        }

        // Slow Decay
        p.life -= 0.005; 

        // Render
        if (p.life > 0) {
            activeParticles = true;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life; 
            ctx.beginPath();
            ctx.rect(p.x, p.y, p.size, p.size);
            ctx.fill();
        } else {
            particles.splice(i, 1);
        }
      }
      
      if (activeParticles) {
          animationFrameId = requestAnimationFrame(loop);
      } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-0 mix-blend-screen"
    />
  );
};
