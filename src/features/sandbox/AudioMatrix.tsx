import { SOUND_METADATA, SoundCategory } from '@/game/config/SoundMetadata';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { Volume2, Play, Activity, Music, Radio, Database, Monitor } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURATION ---

const CATEGORIES: { id: SoundCategory; label: string; icon: any; color: string; border: string; bg: string }[] = [
  { 
    id: 'UI', 
    label: 'SYSTEM_INTERFACE', 
    icon: Monitor, 
    color: 'text-service-cyan', 
    border: 'border-service-cyan',
    bg: 'bg-service-cyan'
  },
  { 
    id: 'COMBAT', 
    label: 'COMBAT_PROTOCOL', 
    icon: Activity, 
    color: 'text-critical-red', 
    border: 'border-critical-red',
    bg: 'bg-critical-red'
  },
  { 
    id: 'AMBIENCE', 
    label: 'ENVIRONMENTAL', 
    icon: Radio, 
    color: 'text-latent-purple', 
    border: 'border-latent-purple',
    bg: 'bg-latent-purple'
  },
  { 
    id: 'UNUSED', 
    label: 'SYNTH_ARCHIVE', 
    icon: Database, 
    color: 'text-primary-green', 
    border: 'border-primary-green',
    bg: 'bg-primary-green'
  },
];

export const AudioMatrix = () => {
  const [activeCat, setActiveCat] = useState<SoundCategory>('UI');
  const [playing, setPlaying] = useState<string | null>(null);

  const activeDef = CATEGORIES.find(c => c.id === activeCat) || CATEGORIES[0];
  const sounds = Object.values(SOUND_METADATA).filter(s => s.category === activeCat);

  const handlePlay = (key: string) => {
    if (key.includes('ambience')) {
        AudioSystem.playAmbience(key);
    } else {
        AudioSystem.playSound(key);
    }
    setPlaying(key);
    setTimeout(() => setPlaying(null), 300);
  };

  return (
    <div className="flex w-full h-full gap-6 pointer-events-auto p-4 md:p-0">
        
        {/* --- LEFT: CATEGORY SELECTOR --- */}
        <div className="w-16 md:w-64 flex-none flex flex-col gap-2">
            {CATEGORIES.map((cat) => {
                const isActive = activeCat === cat.id;
                return (
                    <button
                        key={cat.id}
                        onClick={() => { setActiveCat(cat.id); AudioSystem.playClick(); }}
                        onMouseEnter={() => AudioSystem.playHover()}
                        className={clsx(
                            "relative group flex items-center h-16 md:h-14 px-0 md:px-4 border-l-2 transition-all duration-300 overflow-hidden",
                            isActive 
                                ? `bg-black/60 ${cat.border}`
                                : "border-white/10 hover:border-white/30 hover:bg-white/5"
                        )}
                    >
                        {/* Active Glow Background */}
                        {isActive && (
                            <div className={clsx("absolute inset-0 opacity-10", cat.bg)} />
                        )}

                        <div className="flex items-center justify-center md:justify-start w-full gap-3 relative z-10">
                            <cat.icon 
                                size={20} 
                                className={clsx(
                                    "transition-colors duration-300", 
                                    isActive ? cat.color : "text-gray-500 group-hover:text-gray-300"
                                )} 
                            />
                            <span className={clsx(
                                "hidden md:block font-header font-bold text-xs tracking-widest uppercase transition-colors duration-300",
                                isActive ? cat.color : "text-gray-500 group-hover:text-gray-300"
                            )}>
                                {cat.label}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>

        {/* --- RIGHT: SOUND GRID --- */}
        <div className="flex-1 flex flex-col bg-[#020408]/80 backdrop-blur-md border border-white/10 rounded-sm shadow-2xl relative overflow-hidden">
            
            {/* Header / Visualizer Strip */}
            <div className={clsx("h-10 border-b border-white/5 flex items-center justify-between px-4 bg-gradient-to-r from-black via-black to-transparent", activeDef.color)}>
                <div className="flex items-center gap-2">
                    <Music size={14} className="opacity-70" />
                    <span className="font-mono text-xs font-bold tracking-widest">
                        CHANNEL: {activeCat}
                    </span>
                </div>
                <div className="flex gap-0.5 items-end h-4 opacity-50">
                    {[...Array(12)].map((_, i) => (
                        <motion.div 
                            key={i}
                            className={clsx("w-1 rounded-t-sm", activeDef.bg)}
                            animate={{ height: ["20%", "80%", "30%"] }}
                            transition={{ 
                                duration: 0.5 + Math.random(), 
                                repeat: Infinity, 
                                ease: "easeInOut",
                                delay: i * 0.05
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <AnimatePresence mode="popLayout">
                        {sounds.map((sound) => {
                            const isPlaying = playing === sound.key;
                            return (
                                <motion.button
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    key={sound.key}
                                    onClick={() => handlePlay(sound.key)}
                                    className={clsx(
                                        "group relative flex flex-col items-start p-3 border transition-all duration-100 text-left overflow-hidden h-24 hover:shadow-[0_0_15px_rgba(0,0,0,0.5)]",
                                        isPlaying 
                                            ? `${activeDef.bg} text-black border-transparent scale-95`
                                            : `bg-black/40 border-white/10 hover:border-white/30 ${activeDef.color} hover:bg-white/5`
                                    )}
                                >
                                    <div className="flex w-full justify-between items-start mb-2">
                                        <span className="font-bold text-[10px] tracking-wider uppercase opacity-90 line-clamp-1">
                                            {sound.label}
                                        </span>
                                        <Play size={10} className={clsx("transition-opacity", isPlaying ? "opacity-100" : "opacity-30 group-hover:opacity-100")} />
                                    </div>
                                    
                                    <span className="text-[8px] font-mono opacity-50 mb-auto break-all">
                                        {sound.key}
                                    </span>
                                    
                                    {/* Bottom Decor Bar */}
                                    <div className="w-full h-0.5 bg-current opacity-20 mt-2 group-hover:opacity-100 transition-opacity relative overflow-hidden">
                                        {isPlaying && (
                                            <motion.div 
                                                className="absolute inset-0 bg-white"
                                                initial={{ x: "-100%" }}
                                                animate={{ x: "100%" }}
                                                transition={{ duration: 0.4, ease: "linear" }}
                                            />
                                        )}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    </div>
  );
};
