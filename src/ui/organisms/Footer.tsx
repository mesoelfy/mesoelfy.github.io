export const Footer = () => {
  return (
    <footer className="w-full h-10 border-t border-elfy-green-dim/30 bg-black flex items-center justify-between px-4 z-40 shrink-0 text-[10px] text-elfy-green-dim font-mono">
      <div className="flex items-center gap-2">
        <span>BUILD_VER: [v2.0.4]</span>
        <span>//</span>
        <span className="text-elfy-green">STATUS: STABLE</span>
      </div>

      <div className="flex items-center gap-2">
        <span>LATENT_CORE:</span>
        <div className="w-4 h-4 flex items-center justify-center">
          {/* Smooth Rotation Square */}
          <div className="w-2.5 h-2.5 border border-elfy-green bg-elfy-green/20 animate-spin-slow shadow-[0_0_8px_#78F654]" />
        </div>
      </div>
    </footer>
  );
};
