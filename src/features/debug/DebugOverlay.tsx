import { useEffect, useState } from 'react';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { Terminal, Shield, Skull, Crosshair, Play, RefreshCw, X, Box, Activity, Zap } from 'lucide-react';
import { clsx } from 'clsx';

// --- TABS ---
type Tab = 'OVERRIDES' | 'SANDBOX' | 'STATS';

const TABS: { id: Tab, label: string, icon: any }[] = [
  { id: 'OVERRIDES', label: 'ROOT_ACCESS', icon: Shield },
  { id: 'SANDBOX', label: 'HOLO_DECK', icon: Box },
  { id: 'STATS', label: 'TELEMETRY', icon: Activity },
];

export const DebugOverlay = () => {
  const { isDebugOpen, toggleDebugMenu, debugFlags, setDebugFlag, setBootState, setIntroDone } = useStore();
  const { startGame, stopGame, activateZenMode, healPlayer } = useGameStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('OVERRIDES');

  // KEY LISTENER
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~' || e.key === 'Escape') {
        toggleDebugMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDebugMenu]);

  // ACTIONS
  const handleSkipBoot = () => {
    setIntroDone(true);
    setBootState('active');
    startGame();
    if (isDebugOpen) toggleDebugMenu(); 
  };

  const handleForceCrash = () => {
    useGameStore.setState({ systemIntegrity: 0 });
    stopGame();
    toggleDebugMenu();
  };

  const handleReboot = () => {
    useGameStore.setState({ systemIntegrity: 100, playerHealth: 100 });
    healPlayer(1000);
    toggleDebugMenu();
  };

  if (!isDebugOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md font-mono text-elfy-green p-4">
      
      <div className="w-full max-w-3xl bg-black border border-elfy-green shadow-[0_0_50px_rgba(0,255,65,0.2)] flex flex-col h-[600px] overflow-hidden">
        
        {/* HEADER */}
        <div className="h-10 border-b border-elfy-green/50 bg-elfy-green/10 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <Terminal size={16} />
            <span className="font-bold tracking-widest">KERNEL_ROOT_ACCESS // DEBUG_SUITE</span>
          </div>
          <button onClick={toggleDebugMenu} className="hover:text-white transition-colors"><X /></button>
        </div>

        {/* BODY */}
        <div className="flex flex-1 min-h-0">
          
          {/* SIDEBAR */}
          <div className="w-48 border-r border-elfy-green/30 bg-black/50 flex flex-col">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "p-3 text-left text-xs font-bold tracking-wider border-b border-elfy-green/10 flex items-center gap-2 transition-all hover:bg-elfy-green/20",
                  activeTab === tab.id ? "bg-elfy-green text-black" : "text-elfy-green-dim"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* CONTENT */}
          <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-elfy-green scrollbar-track-black">
            
            {activeTab === 'OVERRIDES' && (
              <div className="space-y-6">
                
                {/* SCENE JUMP */}
                <div className="space-y-3">
                  <h3 className="text-xs text-elfy-green-dim border-b border-elfy-green-dim/30 pb-1 mb-2">SCENE_JUMP</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleSkipBoot} className="flex items-center justify-center gap-2 p-3 border border-elfy-green/50 hover:bg-elfy-green hover:text-black transition-all text-xs font-bold">
                      <Play size={14} /> SKIP_BOOT
                    </button>
                    <button onClick={handleForceCrash} className="flex items-center justify-center gap-2 p-3 border border-elfy-red/50 text-elfy-red hover:bg-elfy-red hover:text-black transition-all text-xs font-bold">
                      <Skull size={14} /> FORCE_CRASH
                    </button>
                    <button onClick={handleReboot} className="flex items-center justify-center gap-2 p-3 border border-elfy-purple/50 text-elfy-purple hover:bg-elfy-purple hover:text-black transition-all text-xs font-bold">
                      <RefreshCw size={14} /> REBOOT_CORE
                    </button>
                    <button onClick={() => { activateZenMode(); toggleDebugMenu(); }} className="flex items-center justify-center gap-2 p-3 border border-elfy-yellow/50 text-elfy-yellow hover:bg-elfy-yellow hover:text-black transition-all text-xs font-bold">
                      <Zap size={14} /> ZEN_MODE
                    </button>
                  </div>
                </div>

                {/* GOD TOGGLES */}
                <div className="space-y-3">
                  <h3 className="text-xs text-elfy-green-dim border-b border-elfy-green-dim/30 pb-1 mb-2">GOD_TOGGLES</h3>
                  
                  {/* FIX: Added data-interactive and stronger hover styles */}
                  <label 
                    data-interactive="true"
                    className="flex items-center justify-between p-3 border border-elfy-green/30 hover:border-elfy-green hover:bg-elfy-green/20 cursor-pointer transition-all select-none"
                  >
                    <span className="text-xs font-bold flex items-center gap-2"><Shield size={14} /> GHOST_MODE (Invincible)</span>
                    <input 
                      type="checkbox" 
                      checked={debugFlags.godMode} 
                      onChange={(e) => setDebugFlag('godMode', e.target.checked)}
                      className="accent-elfy-green cursor-pointer"
                    />
                  </label>

                  <label 
                    data-interactive="true"
                    className="flex items-center justify-between p-3 border border-elfy-green/30 hover:border-elfy-green hover:bg-elfy-green/20 cursor-pointer transition-all select-none"
                  >
                    <span className="text-xs font-bold flex items-center gap-2"><Crosshair size={14} /> PEACE_PROTOCOL (No Spawns)</span>
                    <input 
                      type="checkbox" 
                      checked={debugFlags.peaceMode} 
                      onChange={(e) => setDebugFlag('peaceMode', e.target.checked)}
                      className="accent-elfy-green cursor-pointer"
                    />
                  </label>
                </div>

              </div>
            )}

            {activeTab === 'SANDBOX' && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 text-elfy-green-dim">
                <Box size={48} className="opacity-50" />
                <p>SANDBOX_MODULE // COMING_SOON</p>
                <div className="text-xs max-w-md">
                  This module will allow isolation testing of enemy AI, hitboxes, and animation curves in a controlled 'Holo-Deck' environment.
                </div>
              </div>
            )}

            {activeTab === 'STATS' && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 text-elfy-green-dim">
                <Activity size={48} className="opacity-50" />
                <p>TELEMETRY_MODULE // COMING_SOON</p>
                <div className="text-xs max-w-md">
                  Real-time graphs for FPS, Memory Usage, Entity Pools, and Draw Calls will be visualized here.
                </div>
              </div>
            )}

          </div>
        </div>
        
        {/* FOOTER */}
        <div className="h-6 bg-elfy-green/5 border-t border-elfy-green/30 flex items-center px-4 text-[9px] text-elfy-green-dim">
          <span>ROOT_ACCESS_GRANTED // SESSION_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
        </div>

      </div>
    </div>
  );
};
