import { useStore } from '@/engine/state/global/useStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { Zap, ZapOff } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  layout?: 'horizontal' | 'vertical';
}

export const GraphicsToggle = ({ layout = 'horizontal' }: Props) => {
  const { graphicsMode, setGraphicsMode } = useStore();
  const isHigh = graphicsMode === 'HIGH';

  const handleToggle = (mode: 'HIGH' | 'POTATO') => {
    if (graphicsMode === mode) return;
    setGraphicsMode(mode);
    
    if (mode === 'HIGH') {
        AudioSystem.playSound('ui_optimal');
    } else {
        AudioSystem.playSound('ui_error');
    }
  };

  return (
    <div className={clsx("flex gap-2 w-full", layout === 'vertical' ? "flex-col" : "flex-col")}>
      <div className={clsx("grid gap-px bg-white/10 p-px border border-white/20", layout === 'vertical' ? "grid-cols-1" : "grid-cols-2")}>
        
        {/* ENABLED / HIGH */}
        <button
          onClick={() => handleToggle('HIGH')}
          className={clsx(
            "relative group flex items-center justify-center gap-2 transition-all overflow-hidden",
            layout === 'vertical' ? "h-16 w-full" : "h-12",
            isHigh 
              ? "bg-primary-green/20 text-primary-green" 
              : "bg-black/80 text-gray-600 hover:text-gray-400"
          )}
        >
          {isHigh && (
             <div className="absolute inset-0 border border-primary-green shadow-[inset_0_0_15px_rgba(120,246,84,0.3)] animate-pulse" />
          )}
          <Zap size={16} className={isHigh ? "fill-current" : ""} />
          <div className="flex flex-col leading-none items-start">
              <span className="text-[10px] font-black tracking-wider">ENABLED</span>
              <span className="text-[8px] font-mono opacity-70">HIGH_VOLTAGE</span>
          </div>
        </button>

        {/* DISABLED / POTATO */}
        <button
          onClick={() => handleToggle('POTATO')}
          className={clsx(
            "relative group flex items-center justify-center gap-2 transition-all overflow-hidden",
            layout === 'vertical' ? "h-16 w-full" : "h-12",
            !isHigh 
              ? "bg-alert-yellow/20 text-alert-yellow" 
              : "bg-black/80 text-gray-600 hover:text-gray-400"
          )}
        >
          {!isHigh && (
             <div className="absolute inset-0 border border-alert-yellow shadow-[inset_0_0_15px_rgba(247,210,119,0.3)]" />
          )}
          <ZapOff size={16} />
          <div className="flex flex-col leading-none items-start">
              <span className="text-[10px] font-black tracking-wider">DISABLED</span>
              <span className="text-[8px] font-mono opacity-70">POTATO_MODE</span>
          </div>
        </button>

      </div>
    </div>
  );
};
