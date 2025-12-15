import { ModalContainer } from '@/ui/os/overlays/ModalContainer';
import identity from '@/sys/config/static/identity.json';
import { StatsRadar } from '@/ui/atoms/StatsRadar';
import { DotGridBackground } from '@/ui/atoms/DotGridBackground';
import { motion } from 'framer-motion';
import { Fingerprint, Hash, ShieldAlert } from 'lucide-react';

export const AboutModal = () => {
  // Normalize stats for radar
  const stats = {
    "STR": 30, // Coding Strength?
    "INT": 100,
    "AGI": 80,
    "CHA": 60,
    "LUCK": 90
  };

  return (
    <ModalContainer title="PERSONA_FILE // CLASSIFIED" type="about">
      <div className="flex flex-col lg:flex-row h-full gap-8 relative">
        <DotGridBackground className="opacity-5" />

        {/* --- LEFT: VISUAL PROFILE --- */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
            
            {/* Avatar Frame */}
            <div className="relative aspect-square w-full border-2 border-latent-purple bg-black overflow-hidden group shadow-[0_0_30px_rgba(158,78,165,0.2)]">
                {/* Glitch Image Placeholder */}
                <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/L0qTl8qbSkUIydeumD/giphy.gif')] opacity-20 mix-blend-screen bg-cover" />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <Fingerprint size={48} className="text-latent-purple animate-pulse mb-4" />
                    <span className="text-2xl font-header font-black text-white tracking-widest uppercase drop-shadow-md">
                        {identity.name}
                    </span>
                    <span className="text-[10px] font-mono text-latent-purple-light bg-latent-purple/10 px-2 py-1 mt-2 border border-latent-purple/30">
                        ID: LATENT_SPACE_BANDIT
                    </span>
                </div>

                {/* Corner Brackets */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-latent-purple" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-latent-purple" />
                
                {/* Scanline */}
                <motion.div 
                    className="absolute inset-x-0 h-1 bg-latent-purple/50 shadow-[0_0_10px_#9E4EA5]"
                    animate={{ top: ["0%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
            </div>

            {/* Stats Module */}
            <div className="bg-black/40 border border-latent-purple/20 p-4 flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 px-2 py-1 bg-latent-purple/10 text-[8px] font-mono text-latent-purple font-bold">
                    ATTRIBUTE_MATRIX
                </div>
                <div className="mt-4">
                    <StatsRadar stats={stats} color="#BC86BA" size={180} />
                </div>
            </div>
        </div>

        {/* --- RIGHT: DECRYPTED DATA --- */}
        <div className="flex-1 flex flex-col gap-6 relative">
            
            {/* Header */}
            <div className="border-b border-primary-green/30 pb-4">
                <h2 className="text-4xl md:text-5xl font-header font-black text-primary-green tracking-tighter mb-2 glitch-text">
                    ELFY_
                </h2>
                <div className="flex items-center gap-4 text-xs font-mono text-primary-green-dim">
                    <span className="flex items-center gap-1"><Hash size={12} /> CLASS: ROGUE_DEV</span>
                    <span className="flex items-center gap-1"><ShieldAlert size={12} /> BOUNTY: 5000_BTC</span>
                </div>
            </div>

            {/* Bio */}
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary-green/20">
                <p className="text-lg font-mono text-white/90 leading-relaxed mb-6">
                    <span className="text-primary-green font-bold">&gt; BIO_DECRYPT:</span><br/>
                    {identity.bio}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 border border-primary-green/20 bg-primary-green/5">
                        <h3 className="text-xs font-bold text-primary-green uppercase tracking-widest mb-2 border-b border-primary-green/20 pb-1">
                            Current_Mission
                        </h3>
                        <p className="text-sm font-mono text-primary-green-dim">
                            To bridge the gap between retro aesthetics and modern 3D web technologies.
                        </p>
                    </div>
                    <div className="p-4 border border-latent-purple/20 bg-latent-purple/5">
                        <h3 className="text-xs font-bold text-latent-purple uppercase tracking-widest mb-2 border-b border-latent-purple/20 pb-1">
                            Known_Associates
                        </h3>
                        <p className="text-sm font-mono text-latent-purple-light">
                            React Three Fiber, GLSL, WebAudio API, Next.js.
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-primary-green font-header font-bold uppercase tracking-wider text-sm">
                        SPECIAL_ABILITIES
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {identity.abilities.map((ability, i) => (
                            <span 
                                key={i} 
                                className="px-3 py-1 bg-black border border-primary-green text-primary-green font-mono text-xs hover:bg-primary-green hover:text-black transition-colors cursor-default"
                            >
                                [{ability}]
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-white/10 text-[9px] font-mono text-gray-500 flex justify-between">
                <span>LAST_SEEN: CYBERSPACE</span>
                <span>STATUS: ONLINE</span>
            </div>
        </div>
      </div>
    </ModalContainer>
  );
};
