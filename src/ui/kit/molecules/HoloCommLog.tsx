import { useState, useEffect } from 'react';
import { ExternalLink, Radio, WifiOff, BatteryWarning, SignalHigh } from 'lucide-react';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { useStore } from '@/engine/state/global/useStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { getPan } from '@/engine/audio/AudioUtils';
import { clsx } from 'clsx';
import { useHoloCycler } from '@/ui/kit/hooks/useHoloCycler';
import { PanelId } from '@/engine/config/PanelConfig';

const StaticOverlay = ({ label, icon: Icon, color = "text-primary-green", animate = false }: any) => (
  <div className="absolute inset-0 z-[50] bg-black flex flex-col items-center justify-center overflow-hidden w-full h-full">
    <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif')] opacity-20 bg-cover mix-blend-screen pointer-events-none" />
    <div className={clsx("relative z-10 font-mono text-[10px] bg-black/80 px-2 py-1 flex items-center gap-2 border border-current", color, animate && "animate-pulse")}>
        <Icon size={12} /><span>{label}</span>
    </div>
  </div>
);

const VideoSlot = ({ slotIndex, canMount }: { slotIndex: number, canMount: boolean }) => {
  const panelState = useGameStore((state) => state.panels[PanelId.VIDEO]);
  const isDead = panelState ? (panelState.isDestroyed || panelState.health <= 0) : false;
  const graphicsMode = useStore((state) => state.graphicsMode);
  const isPotato = graphicsMode === 'POTATO';
  const { videoId, isMasked } = useHoloCycler(slotIndex, canMount && !isDead && !isPotato);

  if (isDead) return <div className="relative w-full aspect-video min-h-[140px] md:min-h-0 border border-critical-red/30 bg-black"><StaticOverlay label="SIGNAL_LOST" icon={WifiOff} color="text-critical-red" animate /></div>;
  if (isPotato) return <div className="relative w-full aspect-video min-h-[140px] md:min-h-0 border border-alert-yellow/30 bg-black"><StaticOverlay label="POWER_SAVE_MODE" icon={BatteryWarning} color="text-alert-yellow" /></div>;
  if (!canMount) return <div className="relative w-full aspect-video min-h-[140px] md:min-h-0 border border-primary-green/20 bg-black"><div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-primary-green/30 animate-pulse">INITIALIZING...</div></div>;

  return (
    <div className="relative w-full aspect-video min-h-[140px] md:min-h-0 border border-primary-green-dim/30 bg-black overflow-hidden group/video hover:border-alert-yellow hover:shadow-[0_0_15px_rgba(234,231,71,0.3)] transition-all" onMouseEnter={(e) => AudioSystem.playHover(getPan(e))}>
        {videoId && <div className="absolute inset-0 z-10"><iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&modestbranding=1&loop=1&playlist=${videoId}&vq=small`} frameBorder="0" className="w-full h-full object-cover grayscale pointer-events-none" /></div>}
        <div className="absolute inset-0 z-30 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
        <div className={clsx("absolute inset-0 z-40 transition-all duration-500 flex items-center justify-center pointer-events-none", isMasked ? "opacity-100 bg-black" : "opacity-0 group-hover/video:opacity-100 bg-black/40")}>
             {isMasked ? <div className="flex flex-col items-center"><Radio className="text-primary-green animate-pulse w-6 h-6 mb-2" /><span className="text-[10px] font-mono text-primary-green animate-pulse">ESTABLISHING_UPLINK...</span></div> : <div className="flex items-center gap-2 text-alert-yellow font-mono font-bold bg-black/80 px-3 py-1 border border-alert-yellow rounded-sm pointer-events-auto"><span>OPEN_SOURCE</span><ExternalLink size={12} /></div>}
        </div>
        <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-50 cursor-pointer" onClick={(e) => AudioSystem.playClick(getPan(e))} />
        <div className="absolute bottom-1 right-1 z-[60] text-[8px] text-primary-green font-mono bg-black/80 px-1 pointer-events-none group-hover/video:text-alert-yellow transition-colors flex items-center gap-1"><SignalHigh size={8} /> CAM_0{slotIndex + 1}</div>
    </div>
  );
};

export const HoloCommLog = () => {
  const { bootState } = useStore();
  const [mountStage, setMountStage] = useState(0);
  useEffect(() => {
      if (bootState !== 'active') { setMountStage(0); return; }
      const t1 = setTimeout(() => setMountStage(1), 100);
      const t2 = setTimeout(() => setMountStage(2), 900);
      const t3 = setTimeout(() => setMountStage(3), 1700);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [bootState]);
  return <div className="flex flex-col gap-2 p-1 h-full"><VideoSlot slotIndex={0} canMount={mountStage >= 1} /><VideoSlot slotIndex={1} canMount={mountStage >= 2} /><VideoSlot slotIndex={2} canMount={mountStage >= 3} /></div>;
};
