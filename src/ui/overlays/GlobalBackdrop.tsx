import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/core/store/useStore';
import { AudioSystem } from '@/core/audio/AudioSystem';

export const GlobalBackdrop = () => {
  const { activeModal, isDebugOpen, isDebugMinimized, closeModal, toggleDebugMenu } = useStore();

  // Show if any modal is open OR debug is open (but not minimized)
  const isVisible = (activeModal !== 'none') || (isDebugOpen && !isDebugMinimized);

  const handleDismiss = () => {
    AudioSystem.playSound('ui_menu_close');
    if (isDebugOpen) {
        toggleDebugMenu();
    } else {
        closeModal();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleDismiss}
          // Z-INDEX 150: Above Game (60) AND Intro (100). Below Modals/Settings (200).
          className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm cursor-pointer"
        />
      )}
    </AnimatePresence>
  );
};
