import { Twitter, Youtube, Github, Video, Crosshair, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import socials from '@/data/socials.json';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { useGameStore } from '@/game/store/useGameStore';
import { clsx } from 'clsx';

const IconMap: Record<string, any> = {
  twitter: Twitter,
  youtube: Youtube,
  github: Github,
  video: Video,
  crosshair: Crosshair,
  image: ImageIcon,
};

export const SocialRow = () => {
  const panelState = useGameStore((state) => state.panels['social']);
  const isDestroyed = panelState ? panelState.isDestroyed : false;

  return (
    <div className={clsx(
        "grid grid-cols-3 gap-2 h-full content-center py-2 relative px-2",
        isDestroyed ? "pointer-events-none" : "" 
    )}>
      {socials.map((social, idx) => {
        const Icon = isDestroyed ? AlertTriangle : (IconMap[social.icon] || Crosshair);
        const isGlitch = isDestroyed && (idx % 2 === 0);
        
        return (
          <a
            key={social.name}
            href={isDestroyed ? undefined : social.url}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => !isDestroyed && AudioSystem.playHover()} 
            onClick={() => !isDestroyed && AudioSystem.playClick()}
            className={clsx(
                "group flex flex-col items-center justify-center p-2 border transition-all duration-200",
                isDestroyed 
                    ? "border-elfy-red/20 bg-elfy-red/5 grayscale" 
                    : "border-elfy-green-dim/30 bg-black/40 hover:bg-elfy-yellow/5 hover:border-elfy-yellow hover:shadow-[0_0_15px_rgba(234,231,71,0.15)]"
            )}
          >
            <Icon 
              className={clsx(
                  "w-5 h-5 mb-1 transition-transform duration-200",
                  isDestroyed ? "text-elfy-red animate-pulse" : "text-elfy-green-dim group-hover:text-elfy-yellow group-hover:scale-110",
                  isGlitch ? "translate-x-1" : ""
              )}
              style={!isDestroyed ? { filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' } : {}}
            />
            <span className={clsx(
                "text-[9px] uppercase tracking-wider font-mono transition-colors duration-200",
                isDestroyed ? "text-elfy-red/60" : "text-elfy-green-dim/60 group-hover:text-elfy-yellow"
            )}>
              {isDestroyed ? (isGlitch ? "ERR_404" : "NULL") : social.name.split(' ')[0]}
            </span>
          </a>
        );
      })}
    </div>
  );
};
