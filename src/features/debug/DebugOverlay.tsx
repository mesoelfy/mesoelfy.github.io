import { useEffect, useState } from 'react';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { ServiceLocator } from '@/game/core/ServiceLocator';
import { TimeSystem } from '@/game/systems/TimeSystem';
import { Terminal, Box, Activity, Shield, MinusSquare, X } from 'lucide-react';
import { clsx } from 'clsx';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';

import { OverridesTab } from './tabs/OverridesTab';
import { SandboxTab } from './tabs/SandboxTab';
import { StatsTab } from './tabs/StatsTab';
import { ConsoleTab } from './tabs/ConsoleTab';

type Tab = 'OVERRIDES' | 'SANDBOX' | 'STATS' | 'CONSOLE';

const TABS: { id: Tab, label: string, icon: any }[] = [
  { id: 'OVERRIDES', label: 'ROOT_ACCESS', icon: Shield },
  { id: 'SANDBOX', label: 'HOLO_DECK', icon: Box },
  { id: 'STATS', label: 'TELEMETRY', icon: Activity },
  { id: 'CONSOLE', label: 'KERNEL_LOG', icon: Terminal },
];

export const DebugOverlay = () => {
  const { isDebugOpen, isDebugMinimized, toggleDebugMenu, toggleDebugMinimize, setDebugFlag, bootState, resetApplication } = useStore();
  const { startGame } = useGameStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('OVERRIDES');
  const [stats, setStats] = useState({ active: 0, pooled: 0, total: 0, fps: 0 });
  const [logs, setLogs] = useState<{ time: string, msg: string, type: string }[]>([]);

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
        let fps = 0;
        let regStats = { active: 0, pooled: 0, totalAllocated: 0 };
        
        try {
            const timeSys = ServiceLocator.getSystem<TimeSystem>('TimeSystem');
            fps = timeSys.fps;
            const reg = ServiceLocator.getRegistry();
            if (reg) regStats = reg.getStats();
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

  const exitSimulation = () => {
      resetApplication(); 
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

  if (isDebugMinimized) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md font-mono text-elfy-green p-4">
      <div className="w-full max-w-3xl bg-black border border-elfy-green shadow-[0_0_50px_rgba(0,255,65,0.2)] flex flex-col h-[600px] overflow-hidden relative">
        <div className="h-10 border-b border-elfy-green/50 bg-elfy-green/10 flex items-center justify-center relative px-4 shrink-0">
          <div className="flex items-center gap-2">
            <Terminal size={16} />
            <span className="font-bold tracking-widest">KERNEL_ROOT_ACCESS // DEBUG_SUITE</span>
          </div>
          <div className="absolute right-4 flex items-center gap-2">
             <button onClick={toggleDebugMinimize} className="hover:text-white transition-colors" title="Mini Mode"><MinusSquare size={16} /></button>
             <button onClick={toggleDebugMenu} className="hover:text-white transition-colors" title="Close"><X size={16} /></button>
          </div>
        </div>
        <div className="flex flex-1 min-h-0">
          <div className="w-48 border-r border-elfy-green/30 bg-black/50 flex flex-col">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx("p-3 text-left text-xs font-bold tracking-wider border-b border-elfy-green/10 flex items-center gap-2 transition-all hover:bg-elfy-green/20", activeTab === tab.id ? "bg-elfy-green text-black" : "text-elfy-green-dim")}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-elfy-green scrollbar-track-black">
            {activeTab === 'OVERRIDES' && <OverridesTab closeDebug={toggleDebugMenu} />}
            {activeTab === 'SANDBOX' && <SandboxTab closeDebug={toggleDebugMenu} />}
            {activeTab === 'STATS' && <StatsTab stats={stats} />}
            {activeTab === 'CONSOLE' && <ConsoleTab logs={logs} />}
          </div>
        </div>
        <div className="h-6 bg-elfy-green/5 border-t border-elfy-green/30 flex items-center px-4 text-[9px] text-elfy-green-dim">
          <span>ROOT_ACCESS_GRANTED // SESSION_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};
