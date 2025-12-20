import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/engine/state/global/useStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';

export const GlobalBackdrop = () => {
  const { activeModal, isDebugOpen, isDebugMinimized, closeModal, toggleDebugMenu } = useStore();
  const isVisible = (activeModal !== 'none') || (isDebugOpen && !isDebugMinimized);

  const handleDismiss = () => {
    AudioSystem.playSound('ui_menu_close');
    if (isDebugOpen) { toggleDebugMenu(); } else { closeModal(); }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onClick={handleDismiss} className="fixed inset-0 z-backdrop bg-black/60 backdrop-blur-sm cursor-pointer" />
      )}
    </AnimatePresence>
  );
};
