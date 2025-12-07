import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { Registry } from '@/game/core/ecs/EntityRegistry'; 
import { ServiceLocator } from '@/game/core/ServiceLocator';
import { TimeSystem } from '@/game/systems/TimeSystem';
import { PanelRegistry } from '@/game/systems/PanelRegistrySystem'; 
import { Terminal, Shield, Skull, Crosshair, Play, RefreshCw, X, Box, Activity, Zap, Cpu, Database, MinusSquare, LayoutTemplate, Square, Crown, Bug, Eraser, Clock, Trash2, Sparkles, Ghost } from 'lucide-react';
import { clsx } from 'clsx';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';
import { EnemyTypes } from '@/game/config/Identifiers';

type Tab = 'OVERRIDES' | 'SANDBOX' | 'STATS' | 'CONSOLE';

const TABS: { id: Tab, label: string, icon: any }[] = [
  { id: 'OVERRIDES', label: 'ROOT_ACCESS', icon: Shield },
  { id: 'SANDBOX', label: 'HOLO_DECK', icon: Box },
  { id: 'STATS', label: 'TELEMETRY', icon: Activity },
  { id: 'CONSOLE', label: 'KERNEL_LOG', icon: Terminal },
];

export const DebugOverlay = () => {
  const { isDebugOpen, isDebugMinimized, toggleDebugMenu, toggleDebugMinimize, debugFlags, setDebugFlag, setBootState, setIntroDone, bootState, resetApplication } = useStore();
  const { startGame, stopGame, activateZenMode, healPlayer } = useGameStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('OVERRIDES');
  const [stats, setStats] = useState({ active: 0, pooled: 0, total: 0, fps: 0 });
  const [logs, setLogs] = useState<{ time: string, msg: string, type: string }[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const areAllGodModesOn = debugFlags.godMode && debugFlags.panelGodMode && debugFlags.peaceMode;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDebugMinimized) {
            useStore.setState({ isDebugMinimized: false, isDebugOpen: true });
        } else {
            toggleDebugMenu();
        }
      } else if (e.key === '`' || e.key === '~') {
        if (!isDebugOpen && !isDebugMinimized) {
            toggleDebugMenu();
            if (!useStore.getState().debugFlags.godMode) {
                setDebugFlag('godMode', true);
                setDebugFlag('panelGodMode', true);
                setDebugFlag('peaceMode', true);
            }
        } else {
            toggleDebugMenu();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDebugMenu, isDebugMinimized, isDebugOpen, setDebugFlag]);

  // LOGS & STATS POLLING
  useEffect(() => {
    if (!isDebugOpen && !isDebugMinimized) return;
    
    const handlers = Object.values(GameEvents).map(evt => {
        return GameEventBus.subscribe(evt as any, (payload) => {
            const time = new Date().toLocaleTimeString().split(' ')[0];
            let msg = `${evt}`;
            if (payload && (payload as any).type) msg += ` [${(payload as any).type}]`;
            setLogs(prev => [...prev.slice(-49), { time, msg, type: evt }]);
        });
    });

    const pollInterval = setInterval(() => {
        const regStats = Registry.getStats();
        let fps = 0;
        try {
            const timeSys = ServiceLocator.getSystem<TimeSystem>('TimeSystem');
            fps = timeSys.fps;
        } catch {}

        setStats({
            active: regStats.active,
            pooled: regStats.pooled,
            total: regStats.totalAllocated,
            fps: fps
        });
    }, 250); 

    return () => {
        handlers.forEach(unsub => unsub());
        clearInterval(pollInterval);
    };
  }, [isDebugOpen, isDebugMinimized]);

  useEffect(() => {
      if (activeTab === 'CONSOLE' && logEndRef.current) {
          logEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [logs, activeTab]);

  // --- ACTIONS ---

  const handleSkipBoot = () => {
    setIntroDone(true);
    setBootState('active');
    startGame();
    if (isDebugOpen) toggleDebugMenu(); 
  };

  const handleForceCrash = () => {
    if (bootState === 'standby') {
        setIntroDone(true);
        setBootState('active');
    }
    
    // 1. Update Game Store (Score/State)
    useGameStore.setState({ systemIntegrity: 0 });
    
    // 2. Update Registry Logic (Destroy all Panels instantly)
    PanelRegistry.destroyAll();

    // 3. Emit Event
    GameEventBus.emit(GameEvents.GAME_OVER, { score: 0 });
    stopGame();
    
    if (isDebugOpen) toggleDebugMenu();
  };

  const handleReboot = () => {
    useGameStore.setState({ playerHealth: 100, playerRebootProgress: 0 });
    const panels = PanelRegistry.getAllPanels();
    panels.forEach(p => {
        PanelRegistry.healPanel(p.id, 1000); 
    });
    if (isDebugOpen) toggleDebugMenu();
  };

  const handleZenModeWrapper = () => {
      if (bootState === 'standby') {
          setIntroDone(true);
          setBootState('active');
      }
      activateZenMode();
      if (isDebugOpen) toggleDebugMenu();
  };

  const handleSystemFormat = () => {
      resetApplication();
      // FIX: Do NOT toggleDebugMenu here. resetApplication() resets the store state,
      // setting isDebugOpen: false. Toggling it again would re-open it.
  };

  const toggleGodSuite = () => {
      const newState = !areAllGodModesOn;
      setDebugFlag('godMode', newState);
      setDebugFlag('panelGodMode', newState);
      setDebugFlag('peaceMode', newState);
  };

  const enterSandbox = () => {
      setIntroDone(true);
      setBootState('sandbox');
      Registry.clear();
      startGame();
      toggleDebugMenu();
  };

  const exitSimulation = () => {
      resetApplication(); 
  };
  
  const spawnEnemy = (type: string) => {
      GameEventBus.emit(GameEvents.DEBUG_SPAWN, { type, count: 1 });
  };

  const clearBoard = () => {
      Registry.clear();
  };

  if (!isDebugOpen && !isDebugMinimized) return null;

  if (bootState === 'sandbox') {
      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm font-mono">
            <div className="bg-black border border-elfy-cyan p-8 w-96 shadow-[0_0_50px_rgba(0,240,255,0.2)] text-center">
                <h2 className="text-xl font-bold text-elfy-cyan mb-6 tracking-widest">SIMULATION_PAUSED</h2>
                <div className="flex flex-col gap-4">
                    <button onClick={toggleDebugMenu} className="p-3 border border-elfy-green text-elfy-green hover:bg-elfy-green hover:text-black font-bold tracking-wider transition-colors">RESUME</button>
                    <button onClick={exitSimulation} className="p-3 border border-elfy-red text-elfy-red hover:bg-elfy-red hover:text-black font-bold tracking-wider transition-colors">EXIT_TO_BOOT</button>
                </div>
            </div>
        </div>
      );
  }

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

          <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-elfy-green scrollbar-track-black">
            
            {activeTab === 'OVERRIDES' && (
              <div className="space-y-6">
                
                {/* SCENE CONTROL */}
                <div className="space-y-3">
                  <h3 className="text-xs text-elfy-green-dim border-b border-elfy-green-dim/30 pb-1 mb-2">SCENE_SELECT</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleSkipBoot} className="flex items-center justify-center gap-2 p-3 border border-elfy-green/50 hover:bg-elfy-green hover:text-black transition-all text-xs font-bold">
                      <Play size={14} /> SKIP_BOOT
                    </button>
                    
                    <button 
                      onClick={handleZenModeWrapper} 
                      className="relative flex items-center justify-center gap-2 p-3 overflow-hidden group transition-all duration-300 border border-transparent hover:border-white/50"
                    >
                      <div className="absolute inset-0 opacity-20 group-hover:opacity-40 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 animate-gradient-xy transition-opacity" />
                      <div className="relative z-10 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400 font-bold tracking-widest text-xs group-hover:text-white transition-colors">
                          <Sparkles size={14} className="text-yellow-300" /> ZEN_MODE
                      </div>
                    </button>
                    <button onClick={handleSystemFormat} className="col-span-2 flex items-center justify-center gap-2 p-3 border border-gray-500/50 text-gray-400 hover:bg-white hover:text-black transition-all text-xs font-bold">
                      <Trash2 size={14} /> SYSTEM_FORMAT
                    </button>
                  </div>
                </div>

                {/* STATE OVERRIDES */}
                <div className="space-y-3">
                  <h3 className="text-xs text-elfy-green-dim border-b border-elfy-green-dim/30 pb-1 mb-2">STATE_OVERRIDES</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleForceCrash} className="flex items-center justify-center gap-2 p-3 border border-elfy-red/50 text-elfy-red hover:bg-elfy-red hover:text-black transition-all text-xs font-bold">
                      <Skull size={14} /> FORCE_CRASH
                    </button>
                    <button onClick={handleReboot} className="flex items-center justify-center gap-2 p-3 border border-elfy-purple/50 text-elfy-purple hover:bg-elfy-purple hover:text-black transition-all text-xs font-bold">
                      <RefreshCw size={14} /> REBOOT_CORE
                    </button>
                  </div>
                </div>

                {/* CHEATS */}
                <div className="space-y-3">
                  <h3 className="text-xs text-elfy-green-dim border-b border-elfy-green-dim/30 pb-1 mb-2">GOD_SUITE</h3>
                  
                  <button 
                    onClick={toggleGodSuite}
                    className={clsx(
                        "w-full flex items-center justify-center gap-2 p-2 mb-3 text-xs font-bold transition-all border",
                        areAllGodModesOn
                            ? "bg-elfy-green text-black border-elfy-green shadow-[0_0_10px_rgba(0,255,65,0.4)]" 
                            : "bg-elfy-green/10 text-elfy-green border-elfy-green/50 hover:bg-elfy-green hover:text-black"
                    )}
                  >
                    <Crown size={14} className={areAllGodModesOn ? "fill-black" : ""} />
                    {areAllGodModesOn ? "DISABLE_ALL" : "ENABLE_MAX_POWER"}
                  </button>

                  <label 
                    data-interactive="true"
                    className="flex items-center justify-between p-3 border border-elfy-green/30 hover:border-elfy-green hover:bg-elfy-green/20 cursor-pointer transition-all select-none"
                  >
                    <span className="text-xs font-bold flex items-center gap-2"><Ghost size={14} /> GHOST_MODE (Player Invincible)</span>
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
                    <span className="text-xs font-bold flex items-center gap-2"><Shield size={14} /> FORTRESS_MODE (Panels Invincible)</span>
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

            {/* (SANDBOX, STATS, CONSOLE tabs remain unchanged) */}
            {activeTab === 'SANDBOX' && (
              <div className="h-full flex flex-col items-center justify-center gap-6 text-center">
                  <Box size={64} className="text-elfy-green animate-pulse" />
                  <div>
                      <h2 className="text-xl font-bold mb-2">INITIALIZE_SIMULATION?</h2>
                      <p className="text-xs text-elfy-green-dim max-w-xs mx-auto">
                          Loads the 'Holo-Deck' simulation environment. The main OS will be suspended.
                      </p>
                  </div>
                  <button 
                      onClick={enterSandbox}
                      className="px-8 py-3 bg-elfy-green text-black font-bold tracking-widest hover:bg-white transition-colors"
                  >
                      [ ENTER_HOLO_DECK ]
                  </button>
              </div>
            )}

            {activeTab === 'STATS' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs text-elfy-green-dim border-b border-elfy-green-dim/30 pb-1 mb-2">ENTITY_REGISTRY</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-elfy-green/5 p-4 border border-elfy-green/20">
                        <div className="flex items-center gap-2 text-elfy-green-dim mb-2 text-xs"><Cpu size={14} /> ACTIVE ENTITIES</div>
                        <div className="text-3xl font-bold text-elfy-green">{stats.active}</div>
                    </div>
                    <div className="bg-elfy-green/5 p-4 border border-elfy-green/20">
                        <div className="flex items-center gap-2 text-elfy-green-dim mb-2 text-xs"><Database size={14} /> MEMORY POOL</div>
                        <div className="text-3xl font-bold text-elfy-green-dim">{stats.pooled} <span className="text-xs font-normal opacity-50">/ {stats.total}</span></div>
                    </div>
                  </div>
                </div>
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

            {activeTab === 'CONSOLE' && (
                <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 pr-2">
                        {logs.map((l, i) => (
                            <div key={i} className="flex gap-2 opacity-80 hover:opacity-100 border-b border-white/5 py-0.5">
                                <span className="text-elfy-green-dim">[{l.time}]</span>
                                <span className={l.type.includes('ERROR') ? 'text-elfy-red' : 'text-elfy-green'}>{l.msg}</span>
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </div>
            )}

          </div>
        </div>
        
        <div className="h-6 bg-elfy-green/5 border-t border-elfy-green/30 flex items-center px-4 text-[9px] text-elfy-green-dim">
          <span>ROOT_ACCESS_GRANTED // SESSION_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
        </div>

      </div>
    </div>
  );
};
