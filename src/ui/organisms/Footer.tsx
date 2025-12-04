export const Footer = () => {
  const commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH || 'UNKNOWN';
  const actionsUrl = "https://github.com/mesoelfy/mesoelfy.github.io/actions";

  return (
    <footer className="w-full h-10 border-t border-elfy-green-dim/30 bg-black flex items-center justify-between px-4 z-40 shrink-0 text-[10px] text-elfy-green-dim font-mono">
      <div className="flex items-center gap-2">
        {/* Static Label */}
        <span>BUILD_VER:</span>
        
        {/* Interactive Link */}
        <a 
          href={actionsUrl}
          target="_blank" 
          rel="noopener noreferrer"
          className="text-elfy-green-dim hover:text-elfy-green transition-colors cursor-pointer group"
        >
          [
          {/* Underline only applies to the internal span on hover */}
          <span className="group-hover:underline decoration-dashed decoration-elfy-green underline-offset-2">
            {commitHash}
          </span>
          ]
        </a>
        
        <span>//</span>
        
        <span className="text-elfy-red font-bold animate-pulse">STATUS: UNSAFE // MONITORING</span>
      </div>

      <div className="flex items-center gap-2">
        <span>LATENT_CORE:</span>
        <div className="w-4 h-4 flex items-center justify-center">
          {/* Yellow border/bg, Green Shadow, Custom Diamond Spin */}
          <div className="w-2.5 h-2.5 border border-elfy-yellow bg-elfy-yellow/20 animate-spin-diamond shadow-[0_0_8px_#78F654]" />
        </div>
      </div>
    </footer>
  );
};
