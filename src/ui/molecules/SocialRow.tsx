import { Twitter, Youtube, Github, Video, Crosshair, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import socials from '@/data/socials.json';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { getPan } from '@/core/audio/AudioUtils';
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

interface SocialRowProps {
  layout?: 'grid' | 'column';
}

export const SocialRow = ({ layout = 'grid' }: SocialRowProps) => {
  const panelState = useGameStore((state) => state.panels['social']);
  const isDestroyed = panelState ? panelState.isDestroyed : false;

  return (
    <div className={clsx(
        "gap-2 h-full content-center py-2 relative px-2",
        layout === 'grid' ? "grid grid-cols-3" : "flex flex-col",
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
            onMouseEnter={(e) => !isDestroyed && AudioSystem.playHover(getPan(e))} 
            onClick={(e) => !isDestroyed && AudioSystem.playClick(getPan(e))}
            className={clsx(
                "group flex items-center p-2 border transition-all duration-200",
                layout === 'grid' ? "flex-col justify-center" : "flex-row gap-4 justify-start px-4 h-12",
                isDestroyed 
                    ? "border-critical-red/20 bg-critical-red/5 grayscale" 
                    : "border-primary-green-dim/30 bg-black/40 hover:bg-alert-yellow/5 hover:border-alert-yellow hover:shadow-[0_0_15px_rgba(234,231,71,0.15)]"
            )}
          >
            <Icon 
              className={clsx(
                  "transition-transform duration-200",
                  layout === 'grid' ? "w-5 h-5 mb-1" : "w-6 h-6",
                  isDestroyed ? "text-critical-red animate-pulse" : "text-primary-green-dim group-hover:text-alert-yellow group-hover:scale-110",
                  isGlitch ? "translate-x-1" : ""
              )}
              style={!isDestroyed ? { filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' } : {}}
            />
            <span className={clsx(
                "uppercase tracking-wider font-mono transition-colors duration-200",
                layout === 'grid' ? "text-[9px]" : "text-xs font-bold",
                isDestroyed ? "text-critical-red/60" : "text-primary-green-dim/60 group-hover:text-alert-yellow"
            )}>
              {isDestroyed ? (isGlitch ? "ERR_404" : "NULL") : social.name}
            </span>
          </a>
        );
      })}
    </div>
  );
};
