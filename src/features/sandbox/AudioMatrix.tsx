import { SOUND_METADATA, SoundCategory } from '@/game/config/SoundMetadata';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { Volume2, Play } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';

const SECTIONS: { id: SoundCategory, label: string }[] = [
  { id: 'UI', label: 'USER_INTERFACE' },
  { id: 'COMBAT', label: 'COMBAT_FEEDBACK' },
  { id: 'AMBIENCE', label: 'LOOPS_&_ENV' },
  { id: 'UNUSED', label: 'ARCHIVED_ASSETS' },
];

export const AudioMatrix = () => {
  const [playing, setPlaying] = useState<string | null>(null);

  const handlePlay = (key: string) => {
    if (key.includes('ambience')) {
        AudioSystem.playAmbience(key);
    } else {
        AudioSystem.playSound(key);
    }
    setPlaying(key);
    setTimeout(() => setPlaying(null), 200);
  };

  return (
    <div className="space-y-8 pb-12">
        {SECTIONS.map((section) => {
            const sounds = Object.values(SOUND_METADATA).filter(s => s.category === section.id);
            if (sounds.length === 0) return null;

            return (
                <div key={section.id} className="space-y-4">
                    <div className="flex items-center gap-3 border-b border-service-cyan/30 pb-2">
                        <Volume2 size={16} className={section.id === 'UNUSED' ? "text-gray-500" : "text-service-cyan"} />
                        <h3 className={clsx(
                            "font-header font-black tracking-widest text-sm",
                            section.id === 'UNUSED' ? "text-gray-500" : "text-service-cyan"
                        )}>
                            {section.label}
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {sounds.map((sound) => {
                            const isPlaying = playing === sound.key;
                            return (
                                <button
                                    key={sound.key}
                                    onClick={() => handlePlay(sound.key)}
                                    className={clsx(
                                        "group relative flex flex-col items-start p-3 border transition-all duration-200 text-left overflow-hidden",
                                        isPlaying 
                                            ? "bg-service-cyan text-black border-service-cyan"
                                            : section.id === 'UNUSED' 
                                                ? "bg-white/5 border-white/5 text-gray-500 hover:border-gray-400 hover:text-gray-300"
                                                : "bg-black/40 border-service-cyan/20 text-service-cyan hover:bg-service-cyan/10 hover:border-service-cyan/50"
                                    )}
                                >
                                    {/* Play Icon Overlay */}
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play size={14} className="fill-current" />
                                    </div>

                                    <span className="font-bold text-xs tracking-wider mb-1">{sound.label}</span>
                                    <span className={clsx("text-[10px] font-mono", isPlaying ? "opacity-100" : "opacity-60")}>
                                        {sound.key}
                                    </span>
                                    
                                    <div className={clsx(
                                        "w-full h-px mt-2 mb-2",
                                        isPlaying ? "bg-black/30" : "bg-current opacity-20"
                                    )} />
                                    
                                    <span className={clsx("text-[9px] leading-tight", isPlaying ? "opacity-90" : "opacity-50")}>
                                        USAGE: {sound.usage}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            );
        })}
    </div>
  );
};
