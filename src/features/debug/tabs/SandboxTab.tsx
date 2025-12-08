import { Box } from 'lucide-react';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { ServiceLocator } from '@/game/core/ServiceLocator';

interface SandboxTabProps {
  closeDebug: () => void;
}

export const SandboxTab = ({ closeDebug }: SandboxTabProps) => {
  const { setIntroDone, setBootState } = useStore();
  const { startGame } = useGameStore();

  const enterSandbox = () => {
      setIntroDone(true);
      setBootState('sandbox');
      try {
          const reg = ServiceLocator.getRegistry();
          if (reg) reg.clear();
      } catch {}
      startGame();
      closeDebug();
  };

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 text-center">
        <Box size={64} className="text-elfy-green animate-pulse" />
        <div>
            <h2 className="text-xl font-bold mb-2">INITIALIZE_SIMULATION?</h2>
            <p className="text-xs text-elfy-green-dim max-w-xs mx-auto">
                Loads the 'Holo-Deck' simulation environment. The main OS will be suspended.
            </p>
        </div>
        <button 
            onClick={enterSandbox}
            className="px-8 py-3 bg-elfy-green text-black font-bold tracking-widest hover:bg-white transition-colors"
        >
            [ ENTER_HOLO_DECK ]
        </button>
    </div>
  );
};
