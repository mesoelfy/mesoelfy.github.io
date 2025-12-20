import { useState, useEffect } from 'react';
import { MobileRejectionModal } from './MobileRejectionModal';
import { Canvas } from '@react-three/fiber';
import { MobileGameDirector } from '@/ui/sim/MobileGameDirector';
import { RenderDirector } from '@/ui/sim/RenderDirector';
import { CameraRig } from '@/ui/sim/vfx/CameraRig';
import { TouchRipple } from '@/ui/sim/vfx/TouchRipple';
import { SocialRow } from '@/ui/kit/molecules/SocialRow';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { Skull, Monitor, ExternalLink, AlertTriangle } from 'lucide-react';
import { GlassPanel } from '@/ui/kit/atoms/GlassPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelId } from '@/engine/config/PanelConfig';
import { CAMERA_CONFIG } from '@/engine/config/CameraConfig';

const MOBILE_PANEL_HP = 100;

interface Props {
  skipIntro?: boolean;
}

export const MobileExperience = ({ skipIntro = false }: Props) => {
  const [phase, setPhase] = useState<'intro' | 'game'>(skipIntro ? 'game' : 'intro');
  const [showFailureModal, setShowFailureModal] = useState(false);
  const setIntegrity = useGameStore(s => (val: number) => useGameStore.setState({ systemIntegrity: val }));

  useEffect(() => {
      const unsub = GameEventBus.subscribe(GameEvents.PANEL_DESTROYED, (p) => {
          if (p.id === PanelId.SOCIAL) {
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

  const handleGlobalTap = (e: any) => {
      if (phase !== 'game' || showFailureModal) return;
      
      const x = (e.point.x);
      const y = (e.point.y);

      // 1. Dispatch visual ripple event
      window.dispatchEvent(new CustomEvent('mobile-spatial-tap', { detail: { x, y } }));

      // 2. Play haptic-style audio
      AudioSystem.playSound('ui_click');
  };

  return (
    <div className="absolute inset-0 z-[80] w-full h-full overflow-hidden text-primary-green pointer-events-none">
        {phase === 'intro' && (
            <div className="pointer-events-auto w-full h-full relative z-50">
                <MobileRejectionModal onComplete={() => setPhase('game')} />
            </div>
        )}
        {phase === 'game' && (
            <>
                <div className="absolute inset-0 z-0 pointer-events-auto">
                    <Canvas
                        orthographic
                        camera={{ zoom: CAMERA_CONFIG.BASE_ZOOM, position: [0, 0, 100] }}
                        gl={{ alpha: true, antialias: true }}
                    >
                        <mesh visible={false} onPointerDown={handleGlobalTap}>
                            <planeGeometry args={[100, 100]} />
                        </mesh>

                        <MobileGameDirector />
                        <CameraRig />
                        <TouchRipple />
                        <RenderDirector />
                    </Canvas>
                </div>
                <div className="absolute inset-0 z-10 flex items-center justify-center p-4 pointer-events-none">
                    <div className="w-full max-w-sm pointer-events-auto">
                        <GlassPanel title="SOCIAL_UPLINK" gameId={PanelId.SOCIAL} className="bg-black/90" maxHealth={MOBILE_PANEL_HP}>
                            <SocialRow layout="column" />
                        </GlassPanel>
                    </div>
                </div>
                {!showFailureModal && (
                    <div className="absolute bottom-10 w-full text-center animate-pulse z-20 pointer-events-none">
                        <span className="bg-black/80 px-4 py-1 text-xs font-mono border border-primary-green/30">
                            TAP HOSTILES TO PURGE
                        </span>
                    </div>
                )}
                <AnimatePresence>
                    {showFailureModal && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 pointer-events-auto"
                        >
                            <motion.div 
                                initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }}
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
                                    <Skull size={80} className="text-critical-red mx-auto drop-shadow-[0_0_15px_#FF003C] mb-6" />
                                    <h1 className="text-4xl font-black text-critical-red tracking-widest mb-2 glitch-text">SYSTEM FAILURE</h1>
                                    <p className="text-xs font-mono text-critical-red/70 mb-8">0x0000DEAD // CORE_DUMPED</p>
                                    <a href="https://mesoelfy.github.io" className="group block w-full py-3 bg-critical-red text-black font-bold tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2">
                                        <Monitor size={16} />
                                        <span>REBOOT ON DESKTOP</span>
                                        <ExternalLink size={14} />
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
