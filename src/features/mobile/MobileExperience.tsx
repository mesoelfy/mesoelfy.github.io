import { useState } from 'react';
import { MobileRejectionModal } from './MobileRejectionModal';
import { clsx } from 'clsx';

export const MobileExperience = () => {
  const [view, setView] = useState<'rejection' | 'game'>('rejection');

  return (
    // UPDATED: Removed bg-black to show 3D Scene. Added pointer-events handling.
    <div className="absolute inset-0 z-[80] w-full h-full overflow-hidden text-primary-green pointer-events-none">
        
        {/* PHASE 2: Rejection Cutscene */}
        {view === 'rejection' && (
            <div className="pointer-events-auto w-full h-full">
                <MobileRejectionModal onComplete={() => setView('game')} />
            </div>
        )}

        {/* PHASE 3: Gameplay Placeholder */}
        {view === 'game' && (
            <div className="flex flex-col items-center justify-center h-full animate-in fade-in duration-1000 pointer-events-auto bg-black/80 backdrop-blur-sm">
                <div className="text-center p-8 border border-primary-green/30 bg-primary-green/5 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#78F654_10px,#78F654_12px)]" />
                    <h1 className="text-2xl font-black text-primary-green mb-4 relative z-10">DOOMSCROLL_PROTOCOL</h1>
                    <p className="font-mono text-xs opacity-70 mb-4 relative z-10">
                        SURVIVE THE FEED. TAP TO DESTROY.
                    </p>
                    <div className="w-16 h-16 border-2 border-dashed border-primary-green rounded-full flex items-center justify-center mx-auto animate-spin-slow relative z-10">
                        <span className="text-[10px]">LOADING</span>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
