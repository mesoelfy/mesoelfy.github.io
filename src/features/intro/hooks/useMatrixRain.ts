import { useEffect, useRef } from 'react';
import { useStore } from '@/core/store/useStore';

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
      const isUnsafePhase = currentStep >= 3;
      
      ypos.forEach((y, ind) => {
        const charSet = Math.random() > 0.5 ? 0x16A0 : 0x2200; 
        const text = String.fromCharCode(charSet + Math.random() * 64);
        const x = ind * 20;

        const isPurple = Math.random() > 0.6;
        const isRed = isUnsafePhase && Math.random() > 0.6; 
        let color = '#0F0';
        let blur = 0;

        if (isRed) {
            color = '#FF003C';
            blur = 8;
        } else if (isPurple) {
            color = '#9E4EA5';
            blur = 8;
        }

        ctx.fillStyle = color;
        ctx.shadowBlur = blur;
        ctx.shadowColor = color;
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
