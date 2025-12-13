import { useStore } from '@/core/store/useStore';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Volume2, Monitor, Cpu } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import { SoundTab } from './tabs/SoundTab';
import { GpuConfigPanel } from './components/GpuConfigPanel';
import { DotGridBackground } from '@/ui/atoms/DotGridBackground';

const TABS = [
  { id: 'SOUND', label: 'AUDIO_CONFIG', icon: Volume2 },
  { id: 'GRAPHICS', label: 'GPU_CONFIG', icon: Monitor }, 
  { id: 'SYSTEM', label: 'SYSTEM', icon: Cpu },       
];

export const SettingsModal = () => {
  const { activeModal, closeModal } = useStore();
  const [activeTab, setActiveTab] = useState('SOUND');
  const isOpen = activeModal === 'settings';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 pointer-events-none">
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", bounce: 0, duration: 0.2 }}
            className="relative w-full max-w-5xl h-full max-h-[85vh] bg-black/95 backdrop-blur-md border border-primary-green shadow-[0_0_80px_rgba(0,255,65,0.15)] flex flex-col overflow-hidden pointer-events-auto"
          >
            
            {/* HEADER (No Dots Here) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-primary-green/30 bg-primary-green/5 shrink-0 relative z-20">
              <div className="flex items-center gap-4">
                <div className="p-2 border border-primary-green bg-black/50">
                    <Settings className="text-primary-green animate-spin-slow" size={20} />
                </div>
                <div className="flex flex-col leading-none">
                    <span className="font-header font-black text-xl text-primary-green tracking-widest">
                    SYSTEM_SETTINGS
                    </span>
                    <span className="text-[9px] font-mono text-primary-green-dim tracking-[0.3em] opacity-70">
                        ACCESS_LEVEL: ADMIN
                    </span>
                </div>
              </div>
              <button 
                onClick={() => { closeModal(); AudioSystem.playSound('ui_menu_close'); }}
                onMouseEnter={() => AudioSystem.playHover()} 
                className="p-2 hover:bg-critical-red hover:text-black text-primary-green transition-colors border border-transparent hover:border-critical-red"
              >
                <X size={24} />
              </button>
            </div>

            {/* MAIN LAYOUT */}
            <div className="flex-1 flex overflow-hidden relative z-10">
                
                {/* Background Dots (Scoped to Body) */}
                <DotGridBackground className="opacity-10" />

                {/* SIDEBAR */}
                <div className="w-16 md:w-64 border-r border-primary-green/30 flex flex-col bg-black/40 relative z-10">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                AudioSystem.playClick();
                            }}
                            onMouseEnter={() => AudioSystem.playHover()}
                            className={clsx(
                                "group flex items-center gap-4 px-4 md:px-6 py-5 text-sm font-bold tracking-wider transition-all relative overflow-hidden",
                                activeTab === tab.id
                                    ? "bg-primary-green/10 text-primary-green"
                                    : "text-primary-green-dim hover:text-primary-green hover:bg-primary-green/5"
                            )}
                        >
                            {activeTab === tab.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-green shadow-[0_0_10px_#78F654]" />
                            )}
                            <tab.icon size={20} className={activeTab === tab.id ? "drop-shadow-[0_0_5px_rgba(120,246,84,0.5)]" : ""} />
                            <span className="hidden md:block group-hover:translate-x-1 transition-transform">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 relative scrollbar-thin scrollbar-thumb-primary-green scrollbar-track-black z-10">
                    <div className="relative z-10 w-full h-full max-w-3xl mx-auto">
                        {activeTab === 'SOUND' && <SoundTab />}
                        
                        {activeTab === 'GRAPHICS' && (
                            <div className="max-w-xl mx-auto pt-8 animate-in fade-in slide-in-from-bottom-4">
                                <GpuConfigPanel />
                                <div className="mt-6 p-4 border border-primary-green/30 bg-primary-green/5 text-xs font-mono text-primary-green-dim">
                                    <p className="mb-2 font-bold text-primary-green">&gt; PROFILE_DETAILS:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li><span className="text-white">HIGH_VOLTAGE:</span> Full resolution (Retina), Post-Processing (Bloom, Vignette), Full Particles.</li>
                                        <li><span className="text-alert-yellow">POTATO_MODE:</span> Half resolution (Retro Style), No Post-Processing, Reduced Particles, Static Video Feeds.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {activeTab === 'SYSTEM' && (
                            <div className="flex flex-col items-center justify-center h-64 text-primary-green-dim font-mono animate-in fade-in zoom-in-95">
                                <Cpu size={48} className="mb-4 opacity-50" />
                                <span className="animate-pulse">[ MODULE_OFFLINE ]</span>
                                <span className="text-[10px] mt-2 opacity-50">WAITING FOR KERNEL UPDATE...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div className="px-6 py-2 bg-black/80 border-t border-primary-green/30 flex justify-between items-center text-[10px] font-mono text-primary-green-dim shrink-0 relative z-20">
              <div className="flex gap-6">
                  <span className="flex items-center gap-2">
                      <span className="border border-primary-green/30 px-1.5 py-0.5 rounded text-primary-green bg-primary-green/5">ESC</span> 
                      CLOSE_MENU
                  </span>
                  <span className="hidden md:flex items-center gap-2">
                      <span className="border border-primary-green/30 px-1.5 py-0.5 rounded text-primary-green bg-primary-green/5">~</span> 
                      DEBUG_CONSOLE
                  </span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                  <div className="w-2 h-2 rounded-full bg-primary-green animate-pulse" />
                  ONLINE
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
