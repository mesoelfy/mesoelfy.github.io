import { useEffect, useRef } from 'react';
import { useStore } from '@/engine/state/global/useStore';

export const useMatrixRain = (canvasRef: React.RefObject<HTMLCanvasElement>, isVisible: boolean, isBreaching: boolean, step: number) => {
  const stepRef = useRef(step);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    if (!isVisible && !isBreaching) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = Math.floor(canvas.width / 20);
    const ypos = Array(cols).fill(0).map(() => Math.random() * -1000);

    // Persist randomness per column to avoid flickering colors
    const colRandoms = Array(cols).fill(0).map(() => Math.random());

    const matrixEffect = () => {
      const mode = useStore.getState().graphicsMode;
      if (mode === 'POTATO') {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          return;
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '14px "Courier New"';

      const currentStep = stepRef.current;
      
      ypos.forEach((y, ind) => {
        const charSet = Math.random() > 0.5 ? 0x16A0 : 0x2200; 
        const text = String.fromCharCode(charSet + Math.random() * 64);
        const x = ind * 20;
        const rand = colRandoms[ind];

        let color = '#0F0'; // Default Green
        let shadowColor = '#0F0';
        let shadowBlur = 0;

        if (currentStep === 3) {
            // RED PHASE: 70% Red, 30% Green
            if (rand < 0.7) {
                color = '#FF003C';
                shadowColor = '#FF003C';
                shadowBlur = 8;
            }
        } else if (currentStep === 4) {
            // PURPLE PHASE: 30% Green, 40% Purple, 30% Red
            if (rand < 0.3) {
                color = '#0F0';
            } else if (rand < 0.7) { // 0.3 to 0.7 = 40%
                color = '#9E4EA5';
                shadowColor = '#9E4EA5';
                shadowBlur = 8;
            } else { // 0.7 to 1.0 = 30%
                color = '#FF003C';
                shadowColor = '#FF003C';
                shadowBlur = 8;
            }
        }

        ctx.fillStyle = color;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowColor = shadowColor;
        ctx.fillText(text, x, y);
        ctx.shadowBlur = 0;

        const speed = isBreaching ? 100 : 20; 
        if (y > canvas.height + Math.random() * 10000) ypos[ind] = 0;
        else ypos[ind] = y + speed;
      });
    };
    const interval = setInterval(matrixEffect, 50);
    return () => clearInterval(interval);
  }, [isVisible, isBreaching, canvasRef]);
};
