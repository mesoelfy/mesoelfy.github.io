import { ModalContainer } from '@/ui/overlays/ModalContainer';
import identity from '@/data/identity.json';

export const AboutModal = () => {
  return (
    <ModalContainer title="IDENTITY_DATABASE // ELFY" type="about">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
        
        {/* LEFT: The Avatar Grid */}
        <div className="space-y-4">
          <div className="aspect-square w-full border border-elfy-purple-light/50 bg-elfy-purple-deep/30 relative overflow-hidden group shadow-[0_0_20px_rgba(188,134,186,0.2)]">
            <div className="absolute inset-0 flex items-center justify-center text-elfy-purple-light/50 font-bold text-2xl group-hover:text-elfy-purple-light transition-colors font-header font-black tracking-widest text-center p-4">
              [ COMPOSITE_IMAGE LOADING ]
            </div>
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-elfy-purple-light" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-elfy-purple-light" />
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="aspect-square border border-elfy-purple-dim/30 hover:bg-elfy-purple-light/20 hover:border-elfy-purple-light cursor-pointer transition-colors" />
            ))}
          </div>
        </div>

        {/* RIGHT: The Data */}
        <div className="space-y-6">
          <div>
            {/* Header: Montserrat */}
            <h2 className="text-4xl font-header font-black text-elfy-green mb-2 tracking-wide">HI, I'M ELFY.</h2>
            <div className="h-1 w-20 bg-elfy-purple-light mb-4" />
            
            {/* Body: Courier (font-mono) for ease of reading/typewriter feel */}
            <p className="text-lg text-white/90 leading-relaxed font-mono">
              {identity.bio}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-elfy-purple-light font-header font-bold uppercase tracking-wider text-sm">Capabilities</h3>
            <ul className="space-y-1">
              {identity.abilities.map((ability, i) => (
                 <li key={i} className="flex items-center gap-2 text-elfy-green font-mono">
                   <span className="text-elfy-purple-light">></span> {ability}
                 </li>
              ))}
            </ul>
          </div>

          <div className="p-4 border border-elfy-purple-dim/30 bg-elfy-purple-deep/20 text-sm text-elfy-purple-light font-mono">
            <p>> SYSTEM NOTE: Generated via Latent Space Injection.</p>
            <p>> STATUS: 100% Hype.</p>
          </div>
        </div>
      </div>
    </ModalContainer>
  );
};
