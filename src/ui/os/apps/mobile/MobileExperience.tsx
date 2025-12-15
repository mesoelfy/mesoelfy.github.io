import { useState, useEffect } from 'react';
import { MobileRejectionModal } from './MobileRejectionModal';
import { Canvas } from '@react-three/fiber';
import { MobileGameDirector } from '@/ui/sim/MobileGameDirector';
import { RenderDirector } from '@/ui/sim/RenderDirector';
import { CameraRig } from '@/ui/sim/vfx/CameraRig';
import { SocialRow } from '@/ui/molecules/SocialRow';
import { useGameStore } from '@/sys/state/game/useGameStore';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { Skull, Monitor, ExternalLink, AlertTriangle } from 'lucide-react';
import { GlassPanel } from '@/ui/atoms/GlassPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

// Constants
const MOBILE_PANEL_HP = 100;

const SocialPanelWrapper = () => {
    // Note: No more 5000HP hack. We rely on the standard 100HP config.
    return (
        <div className="w-full max-w-sm pointer-events-auto">
            <GlassPanel title="SOCIAL_UPLINK" gameId="social" className="bg-black/90" maxHealth={MOBILE_PANEL_HP}>
                <SocialRow layout="column" />
            </GlassPanel>
        </div>
    );
};

export const MobileExperience = () => {
  const [phase, setPhase] = useState<'intro' | 'game'>('intro');
  const [showFailureModal, setShowFailureModal] = useState(false);
  const setIntegrity = useGameStore(s => (val: number) => useGameStore.setState({ systemIntegrity: val }));

  useEffect(() => {
      const unsub = GameEventBus.subscribe(GameEvents.PANEL_DESTROYED, (p) => {
          if (p.id === 'social') {
              AudioSystem.playSound('fx_player_death');
              setIntegrity(0);
              setTimeout(() => {
                  setShowFailureModal(true);
                  AudioSystem.playSound('fx_impact_heavy');
              }, 4000);
          }
      });
      return unsub;
  }, [setIntegrity]);

  return (
    <div className="absolute inset-0 z-[80] w-full h-full overflow-hidden text-primary-green pointer-events-none">
        
        {/* PHASE 1: Rejection Cutscene */}
        {phase === 'intro' && (
            <div className="pointer-events-auto w-full h-full relative z-50">
                <MobileRejectionModal onComplete={() => setPhase('game')} />
            </div>
        )}

        {/* PHASE 2: Gameplay */}
        {phase === 'game' && (
            <>
                <div className="absolute inset-0 z-0 pointer-events-auto">
                    <Canvas
                        orthographic
                        camera={{ zoom: 40, position: [0, 0, 100] }}
                        gl={{ alpha: true, antialias: true }}
                    >
                        <MobileGameDirector />
                        <CameraRig />
                        <RenderDirector />
                    </Canvas>
                </div>

                {/* UI LAYER: Added pointer-events-none to container to allow click-through to Canvas */}
                <div className="absolute inset-0 z-10 flex items-center justify-center p-4 pointer-events-none">
                    <SocialPanelWrapper />
                </div>
                
                {/* Instructions */}
                {!showFailureModal && (
                    <div className="absolute bottom-10 w-full text-center animate-pulse z-20 pointer-events-none">
                        <span className="bg-black/80 px-4 py-1 text-xs font-mono border border-primary-green/30">
                            TAP TARGETS TO DESTROY
                        </span>
                    </div>
                )}

                {/* PHASE 3: SYSTEM FAILURE OVERLAY */}
                <AnimatePresence>
                    {showFailureModal && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 pointer-events-auto"
                        >
                            <motion.div 
                                initial={{ scale: 0.8, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                transition={{ type: "spring", bounce: 0.4 }}
                                className="w-full max-w-sm border-2 border-critical-red bg-black shadow-[0_0_50px_rgba(255,0,60,0.4)] overflow-hidden flex flex-col"
                            >
                                <div className="bg-critical-red px-4 py-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-black font-black tracking-widest">
                                        <AlertTriangle size={18} />
                                        <span>CRITICAL_ERROR</span>
                                    </div>
                                    <Skull size={18} className="text-black" />
                                </div>

                                <div className="p-8 flex flex-col items-center text-center relative">
                                    <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#FF003C_10px,#FF003C_12px)] pointer-events-none" />
                                    
                                    <motion.div 
                                        initial={{ scale: 0 }} animate={{ scale: 1 }} 
                                        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                                        className="mb-6 relative"
                                    >
                                        <Skull size={80} className="text-critical-red mx-auto drop-shadow-[0_0_15px_#FF003C]" />
                                    </motion.div>

                                    <h1 className="text-4xl font-black text-critical-red tracking-widest mb-2 glitch-text">
                                        SYSTEM<br/>FAILURE
                                    </h1>
                                    
                                    <p className="text-xs font-mono text-critical-red/70 mb-8 uppercase tracking-widest">
                                        0x0000DEAD // CORE_DUMPED
                                    </p>

                                    <div className="w-full space-y-3 relative z-10">
                                        <div className="bg-critical-red/10 border border-critical-red/30 p-3">
                                            <p className="text-[10px] text-critical-red font-mono leading-relaxed">
                                                MOBILE_TERMINAL_DESTROYED.<br/>
                                                PLEASE MIGRATE TO WORKSTATION.
                                            </p>
                                        </div>

                                        <a 
                                            href="https://mesoelfy.github.io" 
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group block w-full py-3 bg-critical-red text-black font-bold font-header tracking-widest hover:bg-white hover:text-critical-red transition-all flex items-center justify-center gap-2"
                                        >
                                            <Monitor size={16} />
                                            <span>mesoelfy.github.io</span>
                                            <ExternalLink size={14} className="opacity-50 group-hover:opacity-100" />
                                        </a>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-900 px-4 py-1 flex justify-between text-[8px] font-mono text-gray-500">
                                    <span>ERR_CODE: ID_10_T</span>
                                    <span>REBOOT_REQUIRED</span>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        )}
    </div>
  );
};
