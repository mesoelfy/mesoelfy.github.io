import { useStore } from '@/core/store/useStore';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10">
          
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />

          {/* The Window */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="relative w-full max-w-5xl h-full max-h-[90vh] bg-black border border-elfy-neon shadow-[0_0_50px_rgba(0,255,65,0.1)] flex flex-col overflow-hidden"
          >
            {/* Window Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-elfy-neon/10 border-b border-elfy-neon/30">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-elfy-alert rounded-full animate-pulse" />
                <span className="font-mono font-bold text-elfy-neon text-lg tracking-widest">
                  {title}
                </span>
              </div>
              <button 
                onClick={closeModal}
                className="p-1 hover:bg-elfy-alert hover:text-black text-elfy-neon transition-colors"
              >
                <X />
              </button>
            </div>

            {/* Window Content */}
            <div className="flex-1 overflow-auto p-6 relative">
              {/* Scanline Background for Modal */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20" />
              <div className="relative z-10">
                {children}
              </div>
            </div>

            {/* Window Footer */}
            <div className="px-4 py-1 bg-black border-t border-elfy-dim/30 text-xs text-elfy-dim font-mono text-right">
              MODE: SECURE // ENCRYPTION: ENABLED
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
