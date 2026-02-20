import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Infinity as InfinityIcon, Activity } from 'lucide-react';

const barVariants = {
  idle: { filter: "none", transition: { duration: 0.2 } },
  heartbeat: {
    filter: ["brightness(1) drop-shadow(0 0 0px #FF003C)", "brightness(2) drop-shadow(0 0 10px #FF003C)", "brightness(1) drop-shadow(0 0 0px #FF003C)"],
    transition: { duration: 0.8, times: [0, 0.04, 1], ease: "easeOut" }
  }
};

export const IntegrityBar = ({ isGameOver, isZenMode, barRef, isCritical, isWarning, heartbeatControls, slowTransition, integrityRef }: any) => {
    return (
        <>
            <AnimatePresence>
                {!isGameOver && !isZenMode && (
                    <motion.div 
                        key="standard-health-bar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.0 }}
                        className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-gray-900"
                    >
                    <div ref={barRef} className="h-full w-full transition-all duration-100 ease-linear">
                        <motion.div 
                            key={isCritical ? "critical-bar" : "normal-bar"}
                            animate={isCritical ? heartbeatControls : "idle"} variants={barVariants}
                            className={clsx("w-full h-full shadow-[0_0_10px_currentColor]", isCritical ? "bg-critical-red" : isWarning ? "bg-alert-yellow" : "bg-primary-green")} 
                        />
                    </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className={clsx("absolute bottom-[-14px] right-2 text-[8px] font-mono flex items-center gap-1", slowTransition, isZenMode ? "text-purple-400" : (isCritical ? "text-critical-red" : isWarning ? "text-alert-yellow" : "text-primary-green-dim"))}>
                {isZenMode ? <InfinityIcon size={10} /> : <Activity size={8} className={isCritical ? "animate-pulse" : ""} />}
                <span ref={integrityRef}>{isZenMode ? "OS_INTEGRITY: 420%" : "OS_INTEGRITY: 100%"}</span>
            </div>
        </>
    );
};
