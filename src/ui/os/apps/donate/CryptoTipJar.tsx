import { useState } from 'react';
import { Copy, Check, Info, ExternalLink, Hash, MousePointerClick } from 'lucide-react';
import { useAudio } from '@/ui/hooks/useAudio';
import { clsx } from 'clsx';
import identity from '@/engine/config/static/identity.json';
import { MiniCrystalCanvas } from '@/ui/sim/props/MiniCrystalCanvas';

export const CryptoTipJar = () => {
  const [copiedEns, setCopiedEns] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const audio = useAudio();
  
  const ethAddress = identity.crypto.eth_address;
  const ensName = identity.crypto.ens;
  const ensUrl = `https://app.ens.domains/${ensName}`;

  const copyToClipboard = (text: string, isEns: boolean) => {
    navigator.clipboard.writeText(text);
    audio.playSound('syn_data_burst');
    
    if (isEns) {
        setCopiedEns(true);
        setTimeout(() => setCopiedEns(false), 2500);
    } else {
        setCopiedRaw(true);
        setTimeout(() => setCopiedRaw(false), 2500);
    }
  };

  return (
    <div className="w-full min-h-[240px] flex flex-col justify-between p-10 bg-black/40 border-2 border-primary-green/30 relative overflow-hidden transition-all hover:bg-primary-green/5 hover:border-primary-green/50 rounded-sm group">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-6 opacity-30 pointer-events-none">
        <div className="flex gap-2">
            <div className="w-3 h-3 bg-primary-green rounded-full animate-pulse" />
            <div className="w-3 h-3 bg-primary-green rounded-full animate-pulse delay-75" />
            <div className="w-3 h-3 bg-primary-green rounded-full animate-pulse delay-150" />
        </div>
      </div>

      <div className="flex items-center gap-12">
        
        {/* The Crystal Icon */}
        <div className="w-32 h-32 shrink-0 border-2 border-primary-green/50 rounded-full bg-black/50 relative overflow-hidden shadow-[0_0_40px_rgba(120,246,84,0.15)] self-center">
            <div className="absolute inset-0 opacity-100">
                <MiniCrystalCanvas />
            </div>
        </div>

        {/* Address Info */}
        <div className="flex flex-col min-w-0 flex-1 gap-3">
            <span className="text-base text-primary-green-dim font-bold tracking-[0.2em] uppercase mb-1">
                ACCEPTED: ETH, USDC, BASE, OP
            </span>
            
            {/* PRIMARY ENS BUTTON */}
            <button 
                onClick={() => copyToClipboard(ensName, true)}
                className="group/btn relative text-left w-fit"
                title="Click to Copy ENS Address"
            >
                <div className={clsx(
                    "flex items-center gap-6 text-5xl md:text-7xl font-header font-black tracking-wider transition-all",
                    copiedEns ? "text-primary-green" : "text-white group-hover/btn:text-primary-green"
                )}>
                    <span>{ensName}</span>
                    {copiedEns ? (
                        <Check size={48} className="animate-in fade-in zoom-in" />
                    ) : (
                        <MousePointerClick size={48} className="opacity-0 -translate-x-6 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300 text-primary-green" />
                    )}
                </div>
            </button>

            {/* RAW ADDRESS + ACTIONS */}
            <div className="flex flex-wrap items-center gap-4 mt-2">
                <div className="flex items-center gap-4 bg-black/50 px-5 py-3 border border-white/10 rounded group/raw hover:border-white/30 transition-colors">
                    <span className="text-sm font-mono text-gray-400 select-all group-hover/raw:text-white transition-colors">
                        {ethAddress}
                    </span>
                    <button 
                        onClick={() => copyToClipboard(ethAddress, false)}
                        className="text-gray-500 hover:text-primary-green transition-colors"
                        title="Copy Raw Address (Legacy)"
                    >
                        {copiedRaw ? <Check size={18} className="text-primary-green" /> : <Copy size={18} />}
                    </button>
                </div>
                
                <a 
                    href={ensUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm font-bold text-latent-purple hover:text-white transition-colors bg-latent-purple/10 px-5 py-3 rounded border border-latent-purple/20 hover:border-latent-purple/50"
                >
                    <span>VIEW_PROFILE</span>
                    <ExternalLink size={18} />
                </a>
            </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-start gap-3 text-sm text-gray-500 font-mono leading-tight pt-6 border-t border-white/5 mt-4">
        <Hash size={18} className="shrink-0 mt-0.5" />
        <p>
            Simply paste <strong className="text-gray-300">mesoelfy.eth</strong> into any modern wallet. 
            The ledger automatically resolves it to the secure address.
        </p>
      </div>
    </div>
  );
};
