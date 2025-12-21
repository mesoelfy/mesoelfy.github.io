import { useStore } from '@/engine/state/global/useStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { LogOut } from 'lucide-react';

export const MobileFooter = () => {
  const { resetApplication } = useStore();

  const handleExit = () => {
    AudioSystem.playClick();
    resetApplication();
  };

  return (
    <div className="absolute bottom-0 left-0 w-full h-16 flex items-center justify-center z-[90] pointer-events-auto select-none bg-gradient-to-t from-black/90 to-transparent">
        <button 
            onClick={handleExit}
            className="flex items-center gap-2 px-8 py-2 border border-critical-red/30 bg-black/60 rounded-sm text-critical-red text-xs font-bold tracking-widest active:scale-95 transition-transform backdrop-blur-md"
        >
            <LogOut size={12} /> DISCONNECT_UPLINK
        </button>
    </div>
  );
};
