import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const LOGO_COMBINATION = "/assets/ui/logo_combination.svg";
const LOGO_MARK = "/assets/ui/logo_mark.svg";

const MaskedLogo = ({ src, className }: { src: string, className?: string }) => (
    <div className="relative inline-flex items-center justify-center">
        <img src={src} alt="" className={clsx("opacity-0 select-none pointer-events-none relative z-0", className)} aria-hidden="true" />
        <div className="absolute inset-0 bg-current z-10" 
            style={{ 
                maskImage: `url('${src}')`, WebkitMaskImage: `url('${src}')`,
                maskSize: 'contain', WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center', WebkitMaskPosition: 'center'
            }} 
        />
    </div>
);

export const HeaderLogo = ({ isZenMode, isCritical, heartbeatControls, slowTransition, statusColor }: any) => {
    return (
        <motion.div 
            key={isZenMode ? "zen-logo" : "standard-logo"}
            animate={(!isZenMode && isCritical) ? heartbeatControls : "idle"} 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            variants={{ 
                idle: { scale: 1, filter: "drop-shadow(0 0 0px transparent)" },
                heartbeat: { 
                    scale: [1, 1.05, 1], 
                    filter: ["drop-shadow(0 0 0px #FF003C)", "drop-shadow(0 0 15px #FF003C)", "drop-shadow(0 0 0px #FF003C)"], 
                    transition: { duration: 0.8, times: [0, 0.04, 1], ease: "easeOut" } 
                } 
            }} 
            className={clsx("flex items-center", slowTransition, statusColor)}
        >
          {isZenMode ? (
              <div className="flex items-center gap-3">
                  <MaskedLogo src={LOGO_MARK} className="h-8 w-auto" />
                  <motion.span 
                      className="font-header font-black text-xl md:text-2xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-green-500 to-blue-500"
                      animate={{ filter: ["hue-rotate(0deg)", "hue-rotate(360deg)"] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  >
                      ZEN_OS
                  </motion.span>
              </div>
          ) : (
              <MaskedLogo src={LOGO_COMBINATION} className="h-8 w-auto mb-1" />
          )}
        </motion.div>
    );
};
