import { useStore } from '@/core/store/useStore';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Volume2, Cpu, Monitor } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import { SoundTab } from './tabs/SoundTab';

const TABS = [
  { id: 'SOUND', label: 'AUDIO_CONFIG', icon: Volume2 },
  { id: 'GRAPHICS', label: 'DISPLAY', icon: Monitor }, 
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
            className="relative w-full max-w-5xl h-full max-h-[85vh] bg-black border border-primary-green shadow-[0_0_50px_rgba(0,255,65,0.1)] flex flex-col overflow-hidden pointer-events-auto"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-primary-green/30 bg-primary-green/5 shrink-0">
              <div className="flex items-center gap-3">
                <Settings className="text-primary-green animate-spin-slow" size={24} />
                <span className="font-header font-black text-2xl text-primary-green tracking-widest">
                  SYSTEM_SETTINGS
                </span>
              </div>
              <button 
                onClick={() => { closeModal(); AudioSystem.playSound('ui_menu_close'); }}
                onMouseEnter={() => AudioSystem.playHover()} 
                className="p-2 hover:bg-critical-red hover:text-black text-primary-green transition-colors border border-transparent hover:border-critical-red"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-64 border-r border-primary-green/30 flex flex-col bg-black/50">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                AudioSystem.playClick();
                            }}
                            onMouseEnter={() => AudioSystem.playHover()}
                            className={clsx(
                                "flex items-center gap-3 px-6 py-4 text-sm font-bold tracking-wider transition-all border-l-4",
                                activeTab === tab.id
                                    ? "bg-primary-green/10 text-primary-green border-primary-green"
                                    : "border-transparent text-primary-green-dim hover:text-primary-green hover:bg-primary-green/5"
                            )}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-8 relative scrollbar-thin scrollbar-thumb-primary-green scrollbar-track-black">
                    <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-green/20 via-black to-black" />
                    
                    <div className="relative z-10">
                        {activeTab === 'SOUND' && <SoundTab />}
                        
                        {activeTab !== 'SOUND' && (
                            <div className="flex flex-col items-center justify-center h-64 text-primary-green-dim font-mono">
                                <span className="animate-pulse">[ MODULE_OFFLINE ]</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-6 py-2 bg-black border-t border-primary-green/30 flex justify-between items-center text-[10px] font-mono text-primary-green-dim shrink-0">
              <div className="flex gap-4">
                  <span className="flex items-center gap-2">
                      <span className="border border-primary-green/30 px-1.5 py-0.5 rounded text-primary-green">ESC</span> 
                      CLOSE_MENU
                  </span>
                  <span className="flex items-center gap-2">
                      <span className="border border-primary-green/30 px-1.5 py-0.5 rounded text-primary-green">~</span> 
                      DEBUG_CONSOLE
                  </span>
              </div>
              <div className="opacity-50">FIRMWARE v2.0.4</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
