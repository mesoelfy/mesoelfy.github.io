import { motion } from 'framer-motion';

interface BootHeaderProps {
  step: number;
}

export const BootHeader = ({ step }: BootHeaderProps) => {
  const isUnsafe = step === 3;
  const isBypass = step === 4;
  const isSecure = step >= 5;

  let color = "text-primary-green-dim";
  let statusText = "ESTABLISHING...";
  let bgClass = "bg-primary-green/5";
  
  if (isUnsafe) {
      color = "text-critical-red";
      statusText = "SIGNAL_CORRUPTED";
      bgClass = "bg-critical-red/10 border-critical-red/30";
  } else if (isBypass) {
      color = "text-latent-purple-light";
      statusText = "INJECTING_PAYLOAD";
      bgClass = "bg-latent-purple/10 border-latent-purple/30";
  } else if (isSecure) {
      color = "text-primary-green";
      statusText = "UPLINK_STABLE";
      bgClass = "bg-primary-green/10 border-primary-green/30";
  } else if (step >= 1) {
      statusText = "HANDSHAKING...";
  }

  return (
    <div className={`flex shrink-0 items-center justify-between border-b border-white/10 ${bgClass} px-3 py-2 mb-2 select-none relative z-20 transition-all duration-300`}>
      <div className="flex flex-col leading-none gap-1.5 mt-0.5">
          <span className={`text-[10px] font-mono tracking-widest uppercase ${color} transition-colors duration-300 font-bold`}>
            BOOT_LOADER.SYS
          </span>
          <span className="text-[8px] text-gray-500 font-mono tracking-wider opacity-80">{statusText}</span>
      </div>
      
      <div className="flex gap-1 items-end h-3">
        {[0, 1, 2, 3].map(i => {
           let barColor = isUnsafe ? "bg-critical-red" : isBypass ? "bg-latent-purple-light" : "bg-primary-green";
           
           // Default (Static) Height Logic
           let initialHeight = "0.25rem"; // h-1
           if (isUnsafe) initialHeight = i % 2 === 0 ? "0.75rem" : "0.25rem";
           else if (isBypass) initialHeight = (step + i) % 2 === 0 ? "0.75rem" : "0.5rem";
           else if (isSecure) initialHeight = "0.5rem"; // Base height for pulse
           else initialHeight = step >= i ? "0.5rem" : "0.125rem";

           return (
               <motion.div 
                 key={i} 
                 className={`w-1 rounded-sm ${barColor}`}
                 initial={{ height: initialHeight, opacity: 0.7 }}
                 animate={isSecure ? {
                     height: ["0.25rem", "0.75rem", "0.25rem"],
                     opacity: [0.5, 1.0, 0.5],
                     backgroundColor: "#78F654", // Ensure nice green
                     boxShadow: ["0 0 0px #78F654", "0 0 4px #78F654", "0 0 0px #78F654"]
                 } : {
                     height: initialHeight,
                     opacity: isUnsafe ? [0.5, 1, 0.5] : 0.7
                 }}
                 transition={isSecure ? {
                     duration: 1.2,
                     repeat: Infinity,
                     ease: "easeInOut",
                     delay: i * 0.15 // The satisfying sequential delay
                 } : {
                     duration: 0.2
                 }}
               />
           );
        })}
      </div>
    </div>
  );
};
