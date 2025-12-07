import { useEffect, useState } from 'react';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { Registry } from '@/game/core/ecs/EntityRegistry'; 
import { ServiceLocator } from '@/game/core/ServiceLocator';
import { TimeSystem } from '@/game/systems/TimeSystem';
import { Terminal, Shield, Skull, Crosshair, Play, RefreshCw, X, Box, Activity, Zap, Cpu, Database, MinusSquare, LayoutTemplate, Square } from 'lucide-react';
import { clsx } from 'clsx';

// --- TABS ---
type Tab = 'OVERRIDES' | 'SANDBOX' | 'STATS';

const TABS: { id: Tab, label: string, icon: any }[] = [
  { id: 'OVERRIDES', label: 'ROOT_ACCESS', icon: Shield },
  { id: 'SANDBOX', label: 'HOLO_DECK', icon: Box },
  { id: 'STATS', label: 'TELEMETRY', icon: Activity },
];

export const DebugOverlay = () => {
  const { isDebugOpen, isDebugMinimized, toggleDebugMenu, toggleDebugMinimize, debugFlags, setDebugFlag, setBootState, setIntroDone } = useStore();
  const { startGame, stopGame, activateZenMode, healPlayer } = useGameStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('OVERRIDES');
  
  // STATS STATE
  const [stats, setStats] = useState({ active: 0, pooled: 0, total: 0, fps: 0 });

  // KEY LISTENER
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~' || e.key === 'Escape') {
        if (!isDebugOpen && !isDebugMinimized) toggleDebugMenu(); // Open if closed
        else if (isDebugOpen) toggleDebugMenu(); // Close if open
        else if (isDebugMinimized) toggleDebugMenu(); // Close mini mode? Or Restore? Let's say Close.
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDebugMenu, isDebugOpen, isDebugMinimized]);

  // POLLING LOOP (Runs when Open OR Minimized)
  useEffect(() => {
    if (!isDebugOpen && !isDebugMinimized) return;

    const pollInterval = setInterval(() => {
        const regStats = Registry.getStats();
        
        let fps = 0;
        try {
            // FIX: Get REAL FPS from TimeSystem
            const timeSys = ServiceLocator.getSystem<TimeSystem>('TimeSystem');
            fps = timeSys.fps;
        } catch {}

        setStats({
            active: regStats.active,
            pooled: regStats.pooled,
            total: regStats.totalAllocated,
            fps: fps
        });

    }, 250); // Faster updates (250ms)

    return () => clearInterval(pollInterval);
  }, [isDebugOpen, isDebugMinimized]);

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

  // --- RENDER ---

  if (!isDebugOpen && !isDebugMinimized) return null;

  // MINI MODE RENDER
  if (isDebugMinimized) {
      return (
        <div className="fixed top-24 left-4 z-[9999] flex flex-col gap-2 font-mono text-[10px]">
            <div className="bg-black/80 border border-elfy-green p-2 shadow-[0_0_20px_rgba(0,255,65,0.2)] w-32 backdrop-blur-md">
                <div className="flex justify-between items-center border-b border-elfy-green/30 pb-1 mb-1">
                    <span className="text-elfy-green font-bold flex items-center gap-1"><Activity size={10} /> STATS</span>
                    <button onClick={toggleDebugMinimize} className="hover:text-white text-elfy-green"><LayoutTemplate size={10} /></button>
                </div>
                <div className="flex flex-col gap-1 text-elfy-green-dim">
                    <div className="flex justify-between"><span>FPS:</span> <span className="text-white font-bold">{stats.fps}</span></div>
                    <div className="flex justify-between"><span>ENT:</span> <span className="text-white">{stats.active}</span></div>
                    <div className="flex justify-between"><span>MEM:</span> <span className="text-white">{stats.pooled}</span></div>
                </div>
            </div>
        </div>
      );
  }

  // FULL MODE RENDER
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md font-mono text-elfy-green p-4">
      
      <div className="w-full max-w-3xl bg-black border border-elfy-green shadow-[0_0_50px_rgba(0,255,65,0.2)] flex flex-col h-[600px] overflow-hidden relative">
        
        {/* HEADER */}
        <div className="h-10 border-b border-elfy-green/50 bg-elfy-green/10 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <Terminal size={16} />
            <span className="font-bold tracking-widest">KERNEL_ROOT_ACCESS // DEBUG_SUITE</span>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={toggleDebugMinimize} className="hover:text-white transition-colors" title="Mini Mode"><MinusSquare size={16} /></button>
             <button onClick={toggleDebugMenu} className="hover:text-white transition-colors" title="Close"><X size={16} /></button>
          </div>
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
                  
                  <label 
                    data-interactive="true"
                    className="flex items-center justify-between p-3 border border-elfy-green/30 hover:border-elfy-green hover:bg-elfy-green/20 cursor-pointer transition-all select-none"
                  >
                    <span className="text-xs font-bold flex items-center gap-2"><Shield size={14} /> GHOST_MODE (Player Invincible)</span>
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
                    <span className="text-xs font-bold flex items-center gap-2"><Square size={14} /> FORTRESS_MODE (Panels Invincible)</span>
                    <input 
                      type="checkbox" 
                      checked={debugFlags.panelGodMode} 
                      onChange={(e) => setDebugFlag('panelGodMode', e.target.checked)}
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
              <div className="space-y-6">
                
                {/* ENTITY MONITOR */}
                <div className="space-y-3">
                  <h3 className="text-xs text-elfy-green-dim border-b border-elfy-green-dim/30 pb-1 mb-2">ENTITY_REGISTRY</h3>
                  <div className="grid grid-cols-2 gap-4">
                    
                    <div className="bg-elfy-green/5 p-4 border border-elfy-green/20">
                        <div className="flex items-center gap-2 text-elfy-green-dim mb-2 text-xs">
                            <Cpu size={14} /> ACTIVE ENTITIES
                        </div>
                        <div className="text-3xl font-bold text-elfy-green">{stats.active}</div>
                    </div>

                    <div className="bg-elfy-green/5 p-4 border border-elfy-green/20">
                        <div className="flex items-center gap-2 text-elfy-green-dim mb-2 text-xs">
                            <Database size={14} /> MEMORY POOL
                        </div>
                        <div className="text-3xl font-bold text-elfy-green-dim">{stats.pooled} <span className="text-xs font-normal opacity-50">/ {stats.total}</span></div>
                    </div>

                  </div>
                </div>

                {/* RENDER STATS */}
                <div className="space-y-3">
                  <h3 className="text-xs text-elfy-green-dim border-b border-elfy-green-dim/30 pb-1 mb-2">RENDER_PIPELINE</h3>
                  <div className="p-4 border border-elfy-green/20 bg-black">
                      <div className="flex justify-between items-end">
                          <span className="text-xs text-elfy-green-dim">FRAME_RATE</span>
                          <span className="text-xl font-bold text-elfy-green">{stats.fps} FPS</span>
                      </div>
                      <div className="w-full h-1 bg-gray-900 mt-2">
                          <div className="h-full bg-elfy-green" style={{ width: `${Math.min(100, (stats.fps / 60) * 100)}%` }} />
                      </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <button onClick={toggleDebugMinimize} className="flex items-center gap-2 text-xs text-elfy-green hover:text-white transition-colors border border-elfy-green/50 px-4 py-2 hover:bg-elfy-green/10">
                        <LayoutTemplate size={14} /> SWITCH TO MINI_MODE
                    </button>
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
