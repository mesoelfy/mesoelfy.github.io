import { Volume2, VolumeX, Music, Wind, Settings, FastForward, Zap, ZapOff } from 'lucide-react';
import { clsx } from 'clsx';
import { useAudio } from '@/ui/hooks/useAudio';
import { getPan } from '@/engine/audio/AudioUtils';
import { ToggleButton } from '@/ui/kit/atoms/ToggleButton';

export const HeaderControls = ({ audioSettings, toggleMaster, toggleMusic, toggleSfx, toggleAmbience, toggleSettings, statusColor, borderColor, slowTransition, isZenMode }: any) => {
    const audio = useAudio();
    return (
        <div className="flex items-center gap-0">
            <button 
                onClick={(e) => { audio.nextTrack(); audio.playClick(getPan(e)); }}
                onMouseEnter={(e) => audio.playHover(getPan(e))}
                className={clsx("group flex items-center justify-center px-3 h-7 rounded-full border mr-3.5 transition-all duration-200", statusColor, "bg-white/5 border-white/20 opacity-100 hover:bg-current hover:border-transparent")}
                title="Next Track / Shuffle"
            >
                <FastForward size={14} className="fill-transparent group-hover:fill-current group-hover:text-black transition-all duration-200" strokeWidth={2} />
            </button>

            <div className={clsx("flex items-center gap-1 pl-4 border-l", slowTransition, borderColor)}>
                <ToggleButton variant="icon" active={audioSettings.ambience} onClick={toggleAmbience} color={statusColor} icon={Wind} />
                <ToggleButton variant="icon" active={audioSettings.sfx} onClick={toggleSfx} color={statusColor} icon={Music} label="SFX" />
                <ToggleButton variant="icon" active={audioSettings.music} onClick={toggleMusic} color={statusColor} icon={Music} />
                
                <div className={clsx("w-[1px] h-4 mx-1", slowTransition, isZenMode ? "bg-purple-500/30" : "bg-white/10")} />
                
                <ToggleButton variant="icon" active={audioSettings.master} onClick={toggleMaster} color={statusColor} icon={Volume2} iconOff={VolumeX} />
                
                <div className={clsx("w-[1px] h-4 mx-1", slowTransition, isZenMode ? "bg-purple-500/30" : "bg-white/10")} />
                
                <button 
                    onClick={(e) => { toggleSettings(); audio.playSound('ui_menu_open', getPan(e)); }} 
                    className={clsx("group flex items-center justify-center p-1.5 border border-transparent rounded-sm transition-all duration-200", statusColor, "hover:bg-current hover:border-transparent")}
                >
                    <Settings size={17} className="animate-spin-slow text-current group-hover:text-black transition-colors duration-200" />
                </button>
            </div>
        </div>
    );
};
