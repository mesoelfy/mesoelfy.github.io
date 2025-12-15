import { motion } from 'framer-motion';

interface BootHeaderProps {
  step: number;
}

export const BootHeader = ({ step }: BootHeaderProps) => {
  const isUnsafe = step === 3;
  const isBypass = step === 4;
  const isDecrypted = step === 5;
  const isCaution = step >= 6;

  let color = "text-primary-green-dim";
  let statusText = "ESTABLISHING...";
  
  let bgClass = "bg-primary-green/5 border-primary-green/20";
  
  if (isUnsafe) {
      color = "text-critical-red";
      statusText = "SIGNAL_CORRUPTED";
      bgClass = "bg-critical-red/10 border-critical-red/30";
  } else if (isBypass) {
      color = "text-latent-purple-light";
      statusText = "INJECTING_PAYLOAD";
      bgClass = "bg-latent-purple/10 border-latent-purple/30";
  } else if (isDecrypted) {
      color = "text-primary-green";
      statusText = "UPLINK_STABLE";
      bgClass = "bg-primary-green/10 border-primary-green/30";
  } else if (isCaution) {
      color = "text-alert-yellow";
      statusText = "CAUTION_ADVISED";
      bgClass = "bg-alert-yellow/10 border-alert-yellow/30";
  } else if (step >= 1) {
      statusText = "HANDSHAKING...";
  }

  return (
    <div className={`flex shrink-0 items-center justify-between border-b px-3 py-2 mb-2 select-none relative z-20 transition-all duration-300 ${bgClass}`}>
      <div className="flex flex-col leading-none gap-1.5 mt-0.5">
          <span className={`text-[10px] font-mono tracking-widest uppercase ${color} transition-colors duration-300 font-bold`}>
            BOOT_LOADER.SYS
          </span>
          <span className="text-[8px] text-gray-500 font-mono tracking-wider opacity-80">{statusText}</span>
      </div>
      
      <div className="flex gap-1 items-end h-3">
        {[0, 1, 2, 3].map(i => {
           // --- STATIC COLORS ---
           let barClass = "bg-primary-green";
           if (isUnsafe) barClass = "bg-critical-red";
           else if (isBypass) barClass = "bg-latent-purple-light";
           else if (isCaution) barClass = "bg-alert-yellow";

           // --- ANIMATION LOGIC ---
           const isPulseActive = isDecrypted || isCaution; 
           const pulseHex = isCaution ? "#eae747" : "#78F654";

           let animate = {};
           let transition = {};
           let initialHeight = "0.125rem"; // Default tiny

           if (isPulseActive) {
               // 1. Decrypted/Caution Wave (Unchanged)
               initialHeight = "0.5rem";
               animate = {
                   height: ["0.25rem", "0.75rem", "0.25rem"],
                   opacity: [0.5, 1.0, 0.5],
                   backgroundColor: pulseHex,
                   boxShadow: [`0 0 0px ${pulseHex}`, `0 0 4px ${pulseHex}`, `0 0 0px ${pulseHex}`]
               };
               transition = {
                   duration: 1.2,
                   repeat: Infinity,
                   ease: "easeInOut",
                   delay: i * 0.15 
               };
           } else if (isUnsafe) {
               // 2. Unsafe: Slow Communicative Pulse (Fill/Unfill)
               // All bars breathe together to signal a specific error code feel
               initialHeight = "0.25rem";
               animate = {
                   height: ["0.25rem", "0.75rem", "0.25rem"], // Fill and Unfill
                   opacity: [0.5, 1.0, 0.5]
               };
               transition = {
                   duration: 1.5, // Slow
                   repeat: Infinity,
                   ease: "easeInOut"
               };
           } else if (isBypass) {
               // 3. Bypass: Piston Effect
               const isEven = i % 2 === 0;
               initialHeight = isEven ? "0.75rem" : "0.5rem";
               animate = {
                   height: isEven ? ["0.75rem", "0.5rem"] : ["0.5rem", "0.75rem"],
                   opacity: [0.7, 1.0]
               };
               transition = {
                   duration: 0.8,
                   repeat: Infinity,
                   repeatType: "reverse",
                   ease: "easeInOut"
               };
           } else {
               // 4. Handshake: Sequential Fill
               // Strictly show bar based on step index (0, 1, 2)
               const isActive = step >= i; 
               
               if (isActive) {
                   initialHeight = "0.5rem";
                   animate = { opacity: [0.5, 1.0, 0.5] }; // Gentle breathe once active
                   transition = { duration: 2.0, repeat: Infinity, ease: "easeInOut" };
               } else {
                   initialHeight = "0.125rem";
                   animate = { opacity: 0.2 }; // Dim inactive
               }
           }

           return (
               <motion.div 
                 key={i} 
                 className={`w-1 rounded-sm ${barClass}`}
                 initial={{ height: initialHeight }}
                 animate={animate}
                 transition={transition}
               />
           );
        })}
      </div>
    </div>
  );
};
