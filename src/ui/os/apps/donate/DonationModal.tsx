import { ModalContainer } from '@/ui/os/overlays/ModalContainer';
import { CryptoTipJar } from './CryptoTipJar';
import { Coffee, Heart } from 'lucide-react';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import identity from '@/engine/config/static/identity.json';

export const DonationModal = () => {
  const kofiUrl = identity.crypto.kofi_url;

  return (
    <ModalContainer title="SUPPORT_PROTOCOLS // TIP_JAR" type="donate">
      <div className="max-w-2xl mx-auto flex flex-col gap-8 p-4">
        
        <div className="text-center space-y-2 mb-4">
            <h2 className="text-xl font-header font-black text-white tracking-widest">
                FUEL THE LATENT SPACE
            </h2>
            <p className="text-sm font-mono text-primary-green-dim max-w-md mx-auto">
                Contributions keep the servers running and the green flame burning. 
                Select your preferred transfer protocol below.
            </p>
        </div>

        {/* 1. KO-FI BUTTON */}
        <a 
            href={kofiUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={() => AudioSystem.playSound('ui_click')}
            onMouseEnter={() => AudioSystem.playHover()}
            className="group relative w-full h-24 flex items-center bg-[#131415] border border-white/10 hover:border-[#FF5E5B] overflow-hidden transition-all"
        >
            <div className="absolute inset-0 bg-[#FF5E5B] opacity-0 group-hover:opacity-10 transition-opacity" />
            
            <div className="w-24 h-full flex items-center justify-center bg-black/30 border-r border-white/5 group-hover:border-[#FF5E5B]/30 transition-colors">
                <Coffee size={32} className="text-[#FF5E5B] group-hover:scale-110 transition-transform" />
            </div>
            
            <div className="flex-1 px-6">
                <h3 className="text-lg font-bold text-white group-hover:text-[#FF5E5B] transition-colors tracking-wider">
                    KO-FI // FIAT_UPLINK
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-1">
                    Standard credit/debit donation.
                </p>
            </div>

            <div className="pr-6 opacity-30 group-hover:opacity-100 transition-opacity">
                <Heart size={20} className="text-[#FF5E5B]" />
            </div>
        </a>

        {/* 2. CRYPTO JAR */}
        <CryptoTipJar />

      </div>
    </ModalContainer>
  );
};
