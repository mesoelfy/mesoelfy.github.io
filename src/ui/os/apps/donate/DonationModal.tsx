import { ModalContainer } from '@/ui/os/overlays/ModalContainer';
import { CryptoTipJar } from './CryptoTipJar';
import { CryptoGuide } from './CryptoGuide';
import { ENSGuide } from './ENSGuide';
import { Coffee, Heart, HelpCircle, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import identity from '@/engine/config/static/identity.json';
import { useState } from 'react';
import { clsx } from 'clsx';

export const DonationModal = () => {
  const kofiUrl = identity.crypto.kofi_url;
  const [activeGuide, setActiveGuide] = useState<'NONE' | 'CRYPTO' | 'ENS'>('NONE');

  const toggleGuide = (guide: 'CRYPTO' | 'ENS') => {
      if (activeGuide === guide) setActiveGuide('NONE');
      else setActiveGuide(guide);
      AudioSystem.playClick();
  };

  return (
    <ModalContainer 
        title="SUPPORT_PROTOCOLS // TIP_JAR" 
        type="donate" 
        widthClass="max-w-[1600px]" // <--- THIS UNLOCKS THE WIDTH
    >
      <div className="w-full h-full flex flex-col p-10 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-green/20">
        
        {/* HEADER */}
        <div className="text-center space-y-6 mb-12 shrink-0">
            <h2 className="text-5xl md:text-7xl font-header font-black text-white tracking-widest drop-shadow-[0_0_25px_rgba(255,255,255,0.1)]">
                FUEL THE LATENT SPACE
            </h2>
            <p className="text-2xl font-mono text-primary-green-dim max-w-4xl mx-auto leading-relaxed">
                Contributions keep the servers running and the green flame burning. 
            </p>
        </div>

        {/* PRIMARY ACTIONS - VERTICAL STACK */}
        <div className="flex flex-col gap-10 mb-12 shrink-0">
            
            {/* 1. KO-FI BUTTON */}
            <a 
                href={kofiUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => AudioSystem.playSound('ui_click')}
                onMouseEnter={() => AudioSystem.playHover()}
                className="group relative w-full min-h-[200px] flex items-center bg-[#131415] border-2 border-white/10 hover:border-[#FF5E5B] overflow-hidden transition-all shadow-xl hover:shadow-[0_0_40px_rgba(255,94,91,0.15)] rounded-sm"
            >
                <div className="absolute inset-0 bg-[#FF5E5B] opacity-0 group-hover:opacity-5 transition-opacity" />
                
                {/* ICON COLUMN */}
                <div className="w-48 h-full flex items-center justify-center bg-black/30 border-r-2 border-white/5 group-hover:border-[#FF5E5B]/30 transition-colors shrink-0">
                    <Coffee size={80} className="text-[#FF5E5B] group-hover:scale-110 transition-transform duration-300" />
                </div>
                
                {/* TEXT COLUMN */}
                <div className="flex-1 px-12 py-8 flex flex-col justify-center">
                    <h3 className="text-4xl font-bold text-white group-hover:text-[#FF5E5B] transition-colors tracking-wider mb-3">
                        KO-FI // FIAT_UPLINK
                    </h3>
                    <p className="text-xl text-gray-400 font-mono group-hover:text-gray-300">
                        Standard credit/debit donation via PayPal or Stripe.
                    </p>
                </div>

                {/* FLAVOR ICON */}
                <div className="absolute top-8 right-8 opacity-20 group-hover:opacity-100 transition-opacity">
                    <Heart size={40} className="text-[#FF5E5B]" />
                </div>
            </a>

            {/* 2. CRYPTO JAR */}
            <CryptoTipJar />
        </div>

        {/* 3. GUIDES NAVIGATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 shrink-0">
            {/* GUIDE 1 TOGGLE */}
            <button 
                onClick={() => toggleGuide('CRYPTO')}
                className={clsx(
                    "flex items-center justify-between p-10 border-2 transition-all text-left rounded-sm group",
                    activeGuide === 'CRYPTO'
                        ? "bg-primary-green/10 border-primary-green text-primary-green shadow-[0_0_20px_rgba(120,246,84,0.1)]"
                        : "bg-black/40 border-white/10 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/30"
                )}
            >
                <div className="flex items-center gap-8">
                    <div className={clsx("p-5 rounded-full", activeGuide === 'CRYPTO' ? "bg-primary-green/20" : "bg-white/5")}>
                        <HelpCircle size={48} />
                    </div>
                    <div className="flex flex-col gap-3">
                        <span className="text-3xl font-bold tracking-wider">NEW_TO_CRYPTO?</span>
                        <span className="text-lg opacity-60 font-mono uppercase tracking-widest">Setup Guide</span>
                    </div>
                </div>
                {activeGuide === 'CRYPTO' ? <ChevronUp size={32} /> : <ChevronDown size={32} />}
            </button>

            {/* GUIDE 2 TOGGLE */}
            <button 
                onClick={() => toggleGuide('ENS')}
                className={clsx(
                    "flex items-center justify-between p-10 border-2 transition-all text-left rounded-sm group",
                    activeGuide === 'ENS'
                        ? "bg-latent-purple/10 border-latent-purple text-latent-purple shadow-[0_0_20px_rgba(158,78,165,0.1)]"
                        : "bg-black/40 border-white/10 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/30"
                )}
            >
                <div className="flex items-center gap-8">
                    <div className={clsx("p-5 rounded-full", activeGuide === 'ENS' ? "bg-latent-purple/20" : "bg-white/5")}>
                        <Globe size={48} />
                    </div>
                    <div className="flex flex-col gap-3">
                        <span className="text-3xl font-bold tracking-wider">GET_AN_ENS_NAME</span>
                        <span className="text-lg opacity-60 font-mono uppercase tracking-widest">Identity Manual</span>
                    </div>
                </div>
                {activeGuide === 'ENS' ? <ChevronUp size={32} /> : <ChevronDown size={32} />}
            </button>
        </div>

        {/* GUIDE CONTENT AREA */}
        {activeGuide === 'CRYPTO' && <CryptoGuide />}
        {activeGuide === 'ENS' && <ENSGuide />}

      </div>
    </ModalContainer>
  );
};
