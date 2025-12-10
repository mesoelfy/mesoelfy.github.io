import { useEffect, useState } from 'react';
import { useStore } from '@/core/store/useStore';
import { ServiceLocator } from '@/game/core/ServiceLocator';
import { TimeSystem } from '@/game/systems/TimeSystem';
import { Terminal, Box, Activity, Shield, MinusSquare, X, Maximize2, Cpu, Database } from 'lucide-react';
import { clsx } from 'clsx';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';
import { AudioSystem } from '@/core/audio/AudioSystem';

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

const IGNORED_EVENTS = new Set([
    GameEvents.PLAYER_FIRED,
    GameEvents.PLAYER_HIT,
    GameEvents.ENEMY_DAMAGED,
    GameEvents.ENEMY_SPAWNED,
    GameEvents.PANEL_DAMAGED,
    GameEvents.PROJECTILE_CLASH,
    GameEvents.SPAWN_FX,
]);

export const DebugOverlay = () => {
  const { isDebugOpen, isDebugMinimized, toggleDebugMenu, setDebugFlag, bootState, resetApplication, toggleSettings, activeModal, closeModal, openModal } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('OVERRIDES');
  const [stats, setStats] = useState({ active: 0, pooled: 0, total: 0, fps: 0 });
  const [logs, setLogs] = useState<{ time: string, msg: string, type: string }[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        const willBeOpen = !isDebugOpen && !isDebugMinimized;
        
        if (willBeOpen) {
            setDebugFlag('godMode', true);
            setDebugFlag('panelGodMode', true);
            setDebugFlag('peaceMode', true);
        }

        if (activeModal === 'settings') {
            closeModal();
            useStore.setState({ isDebugOpen: true, isDebugMinimized: false });
            AudioSystem.playSound('ui_menu_open');
        } 
        else if (isDebugMinimized) {
             useStore.setState({ isDebugMinimized: false, isDebugOpen: true });
             AudioSystem.playSound('ui_menu_open');
        } 
        else {
             toggleDebugMenu();
             AudioSystem.playSound(!isDebugOpen ? 'ui_menu_open' : 'ui_menu_close');
        }
      } 
      
      else if (e.key === 'Escape') {
          if (isDebugOpen) {
              toggleDebugMenu();
              openModal('settings');
              AudioSystem.playSound('ui_menu_open'); 
          } else if (activeModal !== 'none') {
              closeModal();
              AudioSystem.playSound('ui_menu_close');
          } else {
              toggleSettings();
              AudioSystem.playSound('ui_menu_open');
          }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDebugMenu, isDebugMinimized, isDebugOpen, setDebugFlag, activeModal, toggleSettings, closeModal, openModal]);

  useEffect(() => {
    const handlers = Object.values(GameEvents).map(evt => {
        return GameEventBus.subscribe(evt as any, (payload) => {
            if (IGNORED_EVENTS.has(evt as GameEvents)) return;

            const time = new Date().toLocaleTimeString().split(' ')[0];
            let msg = `${evt}`;
            
            if (evt === GameEvents.LOG_DEBUG && payload && (payload as any).msg) {
                const p = payload as any;
                msg = p.source ? `[${p.source}] ${p.msg}` : p.msg;
            } else if (payload && (payload as any).type) {
                msg += ` [${(payload as any).type}]`;
            } else if (payload && (payload as any).id) {
                msg += ` [ID:${(payload as any).id}]`;
            }
            
            setLogs(prev => [...prev.slice(-99), { time, msg, type: evt }]);
        });
    });

    const pollInterval = setInterval(() => {
        if (!isDebugOpen && !isDebugMinimized) return;
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

  if (!isDebugOpen && !isDebugMinimized) return null;

  if (bootState === 'sandbox') {
      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm font-mono pointer-events-auto">
            <div className="bg-black border border-service-cyan p-8 w-96 shadow-[0_0_50px_rgba(0,240,255,0.2)] text-center">
                <h2 className="text-xl font-bold text-service-cyan mb-6 tracking-widest">SIMULATION_PAUSED</h2>
                <div className="flex flex-col gap-4">
                    <button onClick={toggleDebugMenu} onMouseEnter={() => AudioSystem.playHover()} className="p-3 border border-primary-green text-primary-green hover:bg-primary-green hover:text-black font-bold tracking-wider transition-colors">RESUME</button>
                    <button onClick={resetApplication} onMouseEnter={() => AudioSystem.playHover()} className="p-3 border border-critical-red text-critical-red hover:bg-critical-red hover:text-black font-bold tracking-wider transition-colors">EXIT_TO_BOOT</button>
                </div>
            </div>
        </div>
      );
  }

  if (isDebugMinimized) {
      return (
        <div className="fixed top-1/2 -translate-y-1/2 left-0 z-[10000] p-2 pointer-events-auto">
            <div className="bg-black/90 border border-primary-green/30 p-3 rounded-r shadow-[0_0_15px_rgba(0,255,65,0.1)] flex flex-col gap-2 min-w-[140px] pointer-events-auto cursor-default">
                <div className="flex items-center justify-between border-b border-primary-green/20 pb-1 mb-1">
                    <span className="text-[10px] font-bold text-primary-green tracking-wider">DEBUG_LIVE</span>
                    <button 
                        onClick={() => { useStore.setState({ isDebugMinimized: false, isDebugOpen: true }); AudioSystem.playSound('ui_menu_open'); }} 
                        onMouseEnter={() => AudioSystem.playHover()}
                        className="text-primary-green hover:text-white bg-white/10 p-1 rounded hover:bg-white/20 transition-colors"
                    >
                        <Maximize2 size={12} />
                    </button>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-primary-green-dim"><span className="flex items-center gap-1"><Activity size={10} /> FPS</span><span className="text-primary-green font-bold">{stats.fps}</span></div>
                <div className="flex items-center justify-between text-[10px] font-mono text-primary-green-dim"><span className="flex items-center gap-1"><Cpu size={10} /> ENT</span><span className="text-primary-green font-bold">{stats.active}</span></div>
                <button 
                    onClick={() => { useStore.setState({ isDebugMinimized: false, isDebugOpen: false }); AudioSystem.playSound('ui_menu_close'); }} 
                    onMouseEnter={() => AudioSystem.playHover()}
                    className="text-[9px] bg-critical-red/10 border border-critical-red/30 text-critical-red hover:bg-critical-red hover:text-black py-1.5 uppercase font-bold transition-colors w-full flex justify-center"
                >
                    CLOSE_DEBUG
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md font-mono text-primary-green p-4 pointer-events-auto">
      <div className="w-full max-w-3xl bg-black border border-primary-green shadow-[0_0_50px_rgba(0,255,65,0.2)] flex flex-col h-[600px] overflow-hidden relative">
        <div className="h-10 border-b border-primary-green/50 bg-primary-green/10 flex items-center justify-center relative px-4 shrink-0">
          <div className="flex items-center gap-2"><Terminal size={16} /><span className="font-bold tracking-widest">KERNEL_ROOT_ACCESS // DEBUG_SUITE</span></div>
          <div className="absolute right-4 flex items-center gap-2">
             <button 
                onClick={() => { useStore.setState({ isDebugMinimized: true, isDebugOpen: false }); AudioSystem.playSound('ui_menu_close'); }} 
                onMouseEnter={() => AudioSystem.playHover()}
                className="hover:text-white transition-colors p-1"
             >
                <MinusSquare size={16} />
             </button>
             <button 
                onClick={() => { toggleDebugMenu(); AudioSystem.playSound('ui_menu_close'); }} 
                onMouseEnter={() => AudioSystem.playHover()}
                className="hover:text-white transition-colors p-1"
             >
                <X size={16} />
             </button>
          </div>
        </div>
        <div className="flex flex-1 min-h-0">
          <div className="w-48 border-r border-primary-green/30 bg-black/50 flex flex-col">
            {TABS.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => { setActiveTab(tab.id); AudioSystem.playClick(); }} 
                onMouseEnter={() => AudioSystem.playHover()}
                className={clsx("p-3 text-left text-xs font-bold tracking-wider border-b border-primary-green/10 flex items-center gap-2 transition-all hover:bg-primary-green/20", activeTab === tab.id ? "bg-primary-green text-black" : "text-primary-green-dim")}
              >
                <tab.icon size={14} />{tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-green scrollbar-track-black">
            {activeTab === 'OVERRIDES' && <OverridesTab closeDebug={() => { toggleDebugMenu(); AudioSystem.playSound('ui_menu_close'); }} />}
            {activeTab === 'SANDBOX' && <SandboxTab closeDebug={() => { toggleDebugMenu(); AudioSystem.playSound('ui_menu_close'); }} />}
            {activeTab === 'STATS' && <StatsTab stats={stats} />}
            {activeTab === 'CONSOLE' && <ConsoleTab logs={logs} />}
          </div>
        </div>
        <div className="h-6 bg-primary-green/5 border-t border-primary-green/30 flex items-center px-4 text-[9px] text-primary-green-dim">
          <span>ROOT_ACCESS_GRANTED // EVENTS_FILTERED</span>
        </div>
      </div>
    </div>
  );
};
