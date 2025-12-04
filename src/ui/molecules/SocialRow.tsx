import { Twitter, Youtube, Github, Video, Crosshair, Image as ImageIcon } from 'lucide-react';
import socials from '@/data/socials.json';
import { AudioSystem } from '@/core/audio/AudioSystem';

const IconMap: Record<string, any> = {
  twitter: Twitter,
  youtube: Youtube,
  github: Github,
  video: Video,
  crosshair: Crosshair,
  image: ImageIcon,
};

export const SocialRow = () => {
  return (
    <div className="grid grid-cols-3 gap-2 h-full content-center py-2">
      {socials.map((social) => {
        const Icon = IconMap[social.icon] || Crosshair;
        return (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => AudioSystem.playHover()} // ADDED SFX
            onClick={() => AudioSystem.playClick()}      // ADDED SFX
            className="group flex flex-col items-center justify-center p-2 border border-elfy-green-dim/30 bg-black/40 hover:bg-elfy-green/10 hover:border-elfy-green transition-all duration-300"
          >
            <Icon 
              className="w-5 h-5 mb-1 text-elfy-green-dim group-hover:text-elfy-green group-hover:scale-110 transition-transform" 
              style={{ filter: 'drop-shadow(0 0 2px rgba(120,246,84,0.3))' }}
            />
            <span className="text-[10px] uppercase text-elfy-green-dim/60 group-hover:text-elfy-green tracking-wider font-mono">
              {social.name.split(' ')[0]}
            </span>
          </a>
        );
      })}
    </div>
  );
};
