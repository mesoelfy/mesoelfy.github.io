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
        {[1, 2, 3, 4].map(i => {
           let heightClass = "h-1";
           let animClass = "";
           let barColor = isUnsafe ? "bg-critical-red" : isBypass ? "bg-latent-purple-light" : "bg-primary-green";
           
           if (isUnsafe) {
               heightClass = i % 2 === 0 ? "h-3" : "h-1";
               animClass = "animate-pulse";
           } else if (isBypass) {
               heightClass = (step + i) % 2 === 0 ? "h-3" : "h-2";
           } else if (isSecure) {
               heightClass = "h-3"; 
           } else {
               heightClass = step >= (i-1) ? "h-2" : "h-0.5";
               animClass = step >= (i-1) ? "animate-pulse" : "";
           }

           return (
               <div 
                 key={i} 
                 className={`w-1 rounded-sm transition-all duration-300 ${barColor} ${animClass} ${heightClass}`} 
                 style={{ opacity: isSecure ? 1 : 0.7 }} 
               />
           );
        })}
      </div>
    </div>
  );
};
