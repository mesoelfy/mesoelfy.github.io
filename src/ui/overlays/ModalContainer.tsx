import { useStore } from '@/core/store/useStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalContainerProps {
  children: React.ReactNode;
  title: string;
  type: string;
}

export const ModalContainer = ({ children, title, type }: ModalContainerProps) => {
  const { activeModal, closeModal } = useStore();
  const isOpen = activeModal === type;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 pointer-events-none">
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="relative w-full max-w-5xl h-full max-h-[90vh] bg-black border border-primary-green/50 shadow-[0_0_50px_rgba(0,255,65,0.1)] flex flex-col overflow-hidden pointer-events-auto"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-primary-green/10 border-b border-primary-green/30">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-critical-red rounded-full animate-pulse" />
                <span className="font-header font-black text-primary-green text-lg md:text-xl tracking-widest">
                  {title}
                </span>
              </div>
              <button 
                onClick={() => { closeModal(); AudioSystem.playSound('ui_menu_close'); }}
                onMouseEnter={() => AudioSystem.playHover()} 
                className="p-1 hover:bg-critical-red hover:text-black text-primary-green transition-colors"
              >
                <X />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 relative scrollbar-thin scrollbar-thumb-primary-green scrollbar-track-black">
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20" />
              <div className="relative z-10">
                {children}
              </div>
            </div>

            <div className="px-4 py-1 bg-black border-t border-primary-green/30 text-xs text-primary-green-dim font-mono text-right">
              MODE: SECURE // ENCRYPTION: ENABLED
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
