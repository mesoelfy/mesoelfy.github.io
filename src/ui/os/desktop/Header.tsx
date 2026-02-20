import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeaderViewModel } from './header/useHeaderViewModel';
import { HeaderLogo } from './header/HeaderLogo';
import { HeaderRadar } from './header/HeaderRadar';
import { HeaderControls } from './header/HeaderControls';
import { IntegrityBar } from './header/IntegrityBar';

export const Header = () => {
  const vm = useHeaderViewModel();

  return (
    <header className={clsx("relative w-full h-12 bg-black/90 backdrop-blur-md flex items-center justify-between px-4 z-40 shrink-0 border-b border-white/5", vm.slowTransition)}>
      
      {/* PRISMATIC ZEN BAR (Fades In) */}
      <AnimatePresence>
        {vm.isZenMode && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2.0, ease: "easeInOut" }}
              className="absolute inset-x-0 bottom-0 h-[2px] z-50 overflow-hidden"
            >
                <motion.div 
                    className="w-full h-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500"
                    animate={{ filter: ["hue-rotate(0deg)", "hue-rotate(360deg)"] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                />
            </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        <HeaderLogo {...vm} />
        {vm.mounted && <HeaderRadar {...vm} />}
      </div>
      
      <HeaderControls {...vm} />
      <IntegrityBar {...vm} />
      
    </header>
  );
};
