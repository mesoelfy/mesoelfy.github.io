import { useState, useEffect } from 'react';
import { MobileRejectionModal } from './MobileRejectionModal';
import { Canvas } from '@react-three/fiber';
import { MobileGameDirector } from '@/ui/sim/MobileGameDirector';
import { RenderDirector } from '@/ui/sim/RenderDirector';
import { CameraRig } from '@/ui/sim/vfx/CameraRig';
import { TouchRipple } from '@/ui/sim/vfx/TouchRipple';
import { WireframeFloor } from '@/ui/sim/vfx/WireframeFloor';
import { MobileInputController } from '@/ui/sim/MobileInputController';
import { MobilePanelBase } from '@/ui/sim/props/MobilePanelBase';
import { SocialRow } from '@/ui/kit/molecules/SocialRow';
import { MobileHeader } from '@/ui/kit/molecules/MobileHeader';
import { MobileFooter } from '@/ui/kit/molecules/MobileFooter';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { ExternalLink, AlertTriangle, MousePointer2 } from 'lucide-react';
import { GlassPanel } from '@/ui/kit/atoms/GlassPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelId } from '@/engine/config/PanelConfig';
import { CAMERA_CONFIG } from '@/engine/config/CameraConfig';
import { SadMac } from './SadMac';

const MOBILE_PANEL_HP = 100;

interface Props {
  skipIntro?: boolean;
}

export const MobileExperience = ({ skipIntro = false }: Props) => {
  const [phase, setPhase] = useState<'intro' | 'game'>(skipIntro ? 'game' : 'intro');
  const [showFailureModal, setShowFailureModal] = useState(false);
  const setIntegrity = useGameStore(s => (val: number) => useGameStore.setState({ systemIntegrity: val }));

  // Force cursor hidden
  useEffect(() => {
      document.body.classList.add('cursor-none');
      document.body.style.cursor = 'none';
      return () => { 
          document.body.classList.remove('cursor-none');
          document.body.style.cursor = 'auto'; 
      };
  }, []);

  useEffect(() => {
      const unsub = GameEventBus.subscribe(GameEvents.PANEL_DESTROYED, (p) => {
          if (p.id === PanelId.SOCIAL) {
              AudioSystem.playSound('fx_player_death');
              setIntegrity(0);
              setTimeout(() => {
                  setShowFailureModal(true);
                  AudioSystem.playSound('fx_impact_heavy');
              }, 2000);
          }
      });
      return unsub;
  }, [setIntegrity]);

  return (
    <div className="absolute inset-0 z-[80] w-full h-full overflow-hidden text-primary-green select-none bg-black cursor-none touch-none">
        {phase === 'intro' && (
            <div className="pointer-events-auto w-full h-full relative z-50">
                <MobileRejectionModal onComplete={() => setPhase('game')} />
            </div>
        )}
        {phase === 'game' && (
            <>
                {/* Z-Index 90 is higher than Canvas (0) and GlassPanel (10) */}
                <MobileHeader />
                
                {/* LAYER 0: THE SIMULATION */}
                <div className="absolute inset-0 z-0 pointer-events-auto">
                    <Canvas
                        orthographic
                        camera={{ zoom: CAMERA_CONFIG.BASE_ZOOM, position: [0, 5, 100] }}
                        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
                        style={{ cursor: 'none' }}
                    >
                        <color attach="background" args={['#050505']} />
                        <ambientLight intensity={0.5} />
                        
                        <MobileGameDirector />
                        <CameraRig />
                        
                        <WireframeFloor />
                        <MobilePanelBase />
                        
                        {/* Enemies and Ripples */}
                        <RenderDirector />
                        <TouchRipple />
                        
                        <MobileInputController />
                    </Canvas>
                </div>
                
                {/* LAYER 1: THE INTERFACE (Floaty Panel) */}
                <div className="absolute inset-0 z-10 flex items-center justify-center p-4 pointer-events-none">
                    <div className="w-full max-w-sm pointer-events-auto mt-8">
                        <GlassPanel 
                            title="SOCIAL_UPLINK" 
                            gameId={PanelId.SOCIAL} 
                            transparent={true} 
                            className="shadow-[0_0_30px_rgba(0,0,0,0.5)] border-primary-green/30 bg-black/40 backdrop-blur-sm" 
                            maxHealth={MOBILE_PANEL_HP}
                        >
                            <div className="p-2">
                                <SocialRow layout="column" />
                            </div>
                        </GlassPanel>
                    </div>
                </div>

                {!showFailureModal && (
                    <div className="absolute bottom-20 w-full text-center animate-pulse z-20 pointer-events-none">
                        <span className="bg-black/80 px-4 py-1 text-[10px] font-mono border border-primary-green/30 tracking-widest text-primary-green">
                            TAP HOSTILES TO PURGE
                        </span>
                    </div>
                )}

                <MobileFooter />

                {/* LAYER 2: GAME OVER */}
                <AnimatePresence>
                    {showFailureModal && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 pointer-events-auto cursor-auto"
                        >
                            <motion.div 
                                initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }}
                                className="w-full max-w-sm border-2 border-critical-red bg-black shadow-[0_0_80px_rgba(255,0,60,0.3)] overflow-hidden flex flex-col"
                            >
                                <div className="bg-critical-red px-4 py-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-black font-black tracking-widest">
                                        <AlertTriangle size={18} />
                                        <span>FATAL_EXCEPTION</span>
                                    </div>
                                    <div className="w-3 h-3 bg-black rounded-full" />
                                </div>
                                
                                <div className="p-8 flex flex-col items-center text-center relative">
                                    <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#FF003C_2px,#FF003C_3px)] pointer-events-none" />
                                    
                                    <motion.div 
                                        initial={{ scale: 0 }} animate={{ scale: 1 }} 
                                        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                                        className="mb-6"
                                    >
                                        <SadMac />
                                    </motion.div>

                                    <h1 className="text-3xl font-black text-critical-red tracking-widest mb-2">MOBILE CORE DUMP</h1>
                                    <p className="text-[10px] font-mono text-white/70 mb-8 uppercase leading-relaxed max-w-[200px]">
                                        <span className="text-critical-red font-bold">NEURAL LINK SEVERED.</span><br/>
                                        THE SIMULATION REQUIRES<br/>
                                        HIGHER COMPUTATIONAL POWER.
                                    </p>

                                    <a 
                                        href="https://mesoelfy.github.io" 
                                        className="group w-full py-4 bg-critical-red text-black font-header font-black text-sm tracking-[0.15em] hover:bg-white transition-all flex items-center justify-center gap-3 cursor-pointer"
                                    >
                                        <MousePointer2 size={18} className="fill-current" />
                                        <span>FULL TERMINAL REQUIRED</span>
                                        <ExternalLink size={14} className="opacity-50 group-hover:opacity-100" />
                                    </a>
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
