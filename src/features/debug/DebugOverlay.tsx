import { useEffect, useState } from 'react';
import { useStore } from '@/core/store/useStore';
import { ServiceLocator } from '@/game/core/ServiceLocator';
import { TimeSystem } from '@/game/systems/TimeSystem';
import { Terminal, Box, Activity, Shield, MinusSquare, X, Maximize2, Cpu } from 'lucide-react';
import { clsx } from 'clsx';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { DotGridBackground } from '@/ui/atoms/DotGridBackground';

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
            {/* Minimal floating pause menu */}
        </div>
      );
  }

  // --- FULL DEBUG MENU ---
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md font-mono text-primary-green p-4 pointer-events-auto">
      <div className="w-full max-w-4xl bg-[#050a05] border border-primary-green/50 shadow-[0_0_100px_rgba(0,255,65,0.1)] flex flex-col h-[650px] overflow-hidden relative rounded-sm">
        
        {/* Header */}
        <div className="h-12 border-b border-primary-green/30 bg-primary-green/5 flex items-center justify-between px-6 shrink-0 relative z-20">
          <div className="flex items-center gap-3">
              <Terminal size={18} className="text-primary-green animate-pulse" />
              <div className="flex flex-col leading-none">
                  <span className="font-header font-black tracking-widest text-sm">KERNEL_DEBUG</span>
                  <span className="text-[9px] opacity-60 font-mono">ROOT_ACCESS_GRANTED</span>
              </div>
          </div>
          <div className="flex items-center gap-2">
             <button 
                onClick={() => { useStore.setState({ isDebugMinimized: true, isDebugOpen: false }); AudioSystem.playSound('ui_menu_close'); }} 
                onMouseEnter={() => AudioSystem.playHover()}
                className="hover:text-white transition-colors p-2 hover:bg-white/10 rounded"
             >
                <MinusSquare size={16} />
             </button>
             <button 
                onClick={() => { toggleDebugMenu(); AudioSystem.playSound('ui_menu_close'); }} 
                onMouseEnter={() => AudioSystem.playHover()}
                className="hover:text-critical-red transition-colors p-2 hover:bg-critical-red/10 rounded"
             >
                <X size={16} />
             </button>
          </div>
        </div>
        
        <div className="flex flex-1 min-h-0 relative z-10">
          <DotGridBackground className="opacity-5" />

          {/* Sidebar */}
          <div className="w-56 border-r border-primary-green/20 bg-black/40 flex flex-col relative z-20 py-4">
            {TABS.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => { setActiveTab(tab.id); AudioSystem.playClick(); }} 
                onMouseEnter={() => AudioSystem.playHover()}
                className={clsx(
                    "px-6 py-3 text-left text-xs font-bold tracking-widest flex items-center gap-3 transition-all relative overflow-hidden",
                    activeTab === tab.id 
                        ? "text-primary-green bg-primary-green/10" 
                        : "text-primary-green-dim hover:text-white hover:bg-white/5"
                )}
              >
                {activeTab === tab.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-green shadow-[0_0_10px_#78F654]" />}
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-green/50 scrollbar-track-black relative z-20">
            {activeTab === 'OVERRIDES' && <OverridesTab closeDebug={() => { toggleDebugMenu(); AudioSystem.playSound('ui_menu_close'); }} />}
            {activeTab === 'SANDBOX' && <SandboxTab closeDebug={() => { toggleDebugMenu(); AudioSystem.playSound('ui_menu_close'); }} />}
            {activeTab === 'STATS' && <StatsTab stats={stats} />}
            {activeTab === 'CONSOLE' && <ConsoleTab logs={logs} />}
          </div>
        </div>

        {/* Footer */}
        <div className="h-8 bg-black/80 border-t border-primary-green/20 flex justify-between items-center px-6 text-[9px] text-primary-green-dim font-mono z-20">
          <span>MESOELFY_OS // DEBUG_BUILD</span>
          <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-green animate-pulse" />
              <span>SYSTEM_ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
