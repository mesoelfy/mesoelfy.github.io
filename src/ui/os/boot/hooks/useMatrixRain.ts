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
      
      // COLOR LOGIC:
      // Step 0-2: Green
      // Step 3 (Unsafe): Red
      // Step 4 (Bypass): Purple
      // Step 5+ (Decrypted): Green
      let baseColor = '#0F0'; // Default Green
      let shadowColor = '#0F0';
      let shadowBlur = 0;

      if (currentStep === 3) {
          baseColor = '#FF003C'; // Critical Red
          shadowColor = '#FF003C';
          shadowBlur = 8;
      } else if (currentStep === 4) {
          baseColor = '#9E4EA5'; // Latent Purple
          shadowColor = '#9E4EA5';
          shadowBlur = 8;
      }

      ypos.forEach((y, ind) => {
        const charSet = Math.random() > 0.5 ? 0x16A0 : 0x2200; 
        const text = String.fromCharCode(charSet + Math.random() * 64);
        const x = ind * 20;

        ctx.fillStyle = baseColor;
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
