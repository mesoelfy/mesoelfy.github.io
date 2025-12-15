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
    if (!canvas || !canvas.parentElement) return;
    
    // Safety check: Don't initialize if container is collapsed
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;
    
    if (width === 0 || height === 0) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    let particles: Particle[] = [];
    let animationFrameId: number;
    let isActive = true;

    const COLORS = ['#FF003C', '#CC0020', '#800010', '#FF4466'];
    
    // REVERTED: Back to 500 as requested
    const PARTICLE_COUNT = 500; 
    
    try {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const edge = Math.floor(Math.random() * 3); 
            let x = 0, y = 0, vx = 0, vy = 0;

            if (edge === 0) { 
                x = Math.random() * width;
                y = 0;
                vx = (Math.random() - 0.5) * 8;
                vy = (Math.random() * 5) + 2; 
            } else if (edge === 1) { 
                x = 0;
                y = Math.random() * (height * 0.5); 
                vx = (Math.random() * 5) + 2; 
                vy = (Math.random() * 5) - 2;
            } else { 
                x = width;
                y = Math.random() * (height * 0.5);
                vx = -((Math.random() * 5) + 2); 
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
    } catch (e) {
        console.error("Error creating particles", e);
        return;
    }

    const loop = () => {
      if (!isActive) return;
      if (!canvas || canvas.width === 0) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let activeParticles = false;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; 
        
        if (p.y > canvas.height) {
          p.y = canvas.height;
          p.vy *= -0.5; 
          p.vx *= 0.7;  
        }
        
        if (p.x < 0 || p.x > canvas.width) {
          p.vx *= -0.6;
          p.x = Math.max(0, Math.min(canvas.width, p.x));
        }

        p.life -= 0.005; 

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
      isActive = false;
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
