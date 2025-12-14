import { useGameStore } from '@/game/store/useGameStore';
import { useStore } from '@/core/store/useStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { clsx } from 'clsx';

export const FeedAccessTerminal = () => {
  const { openModal } = useStore();
  const panelState = useGameStore((state) => state.panels['feed']);
  const isDestroyed = panelState ? panelState.isDestroyed : false;

  return (
    <div className={clsx(
        "w-full h-full flex items-center justify-center p-4 transition-all duration-500",
        // When destroyed: Fade out almost completely and disable interaction
        isDestroyed ? "opacity-10 pointer-events-none blur-sm grayscale" : "opacity-100 blur-0"
    )}>
        <div className="flex flex-col items-center justify-center gap-4 bg-black/20 p-8 w-full max-w-lg marching-ants [--ant-color:rgba(27,185,48,0.3)]">
            <p className="animate-pulse text-primary-green-dim text-xs tracking-widest font-bold">&gt; ESTABLISHING UPLINK...</p>
            <button 
                onClick={() => { AudioSystem.playClick(); openModal('feed'); }} 
                onMouseEnter={() => AudioSystem.playHover()}
                className="group w-full py-3 border border-primary-green-dim/50 text-primary-green font-header font-black text-lg tracking-[0.2em] uppercase transition-all duration-300 hover:border-alert-yellow hover:text-alert-yellow hover:shadow-[0_0_20px_rgba(234,231,71,0.3)] hover:bg-alert-yellow/5 relative overflow-hidden"
            >
                <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300 inline-block">
                    [ ACCESS_TERMINAL ]
                </span>
            </button>
        </div>
    </div>
  );
};
