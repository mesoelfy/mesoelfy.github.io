import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

const panelVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export const GlassPanel = ({ children, className, title }: GlassPanelProps) => {
  return (
    <motion.div 
      variants={panelVariants} // Will inherit 'hidden'/'visible' from parent
      className={clsx(
        "relative overflow-hidden flex flex-col",
        "bg-black border border-elfy-green-dim/30",
        "shadow-[0_0_15px_rgba(11,212,38,0.05)]", 
        "rounded-sm",
        className
      )}
    >
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(10,10,10,0.4)_50%)] z-0 bg-[length:100%_4px]" />
      
      {title && (
        <div className="flex items-center justify-between px-3 py-1 border-b border-elfy-green-dim/30 bg-elfy-green-dark/20 shrink-0">
          <span className="text-xs font-mono font-bold text-elfy-green uppercase tracking-widest drop-shadow-md">
            {title}
          </span>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-elfy-green" />
            <div className="w-2 h-2 rounded-full border border-elfy-purple-dim" />
          </div>
        </div>
      )}

      <div className="relative z-10 p-4 h-full">
        {children}
      </div>
    </motion.div>
  );
};
