import { useState } from 'react';
import { Copy, Check, Info } from 'lucide-react';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { clsx } from 'clsx';
import identity from '@/engine/config/static/identity.json';
import { MiniCrystalCanvas } from '@/ui/sim/props/MiniCrystalCanvas';

export const CryptoTipJar = () => {
  const [copied, setCopied] = useState(false);
  const ethAddress = identity.crypto.eth_address;
  const ensName = identity.crypto.ens;

  const handleCopy = () => {
    if (!ethAddress) return;
    navigator.clipboard.writeText(ethAddress);
    setCopied(true);
    AudioSystem.playSound('syn_data_burst');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full flex flex-col gap-4 p-6 bg-black/40 border border-primary-green/30 relative overflow-hidden group">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-2 opacity-50">
        <div className="flex gap-1">
            <div className="w-1 h-1 bg-primary-green rounded-full animate-pulse" />
            <div className="w-1 h-1 bg-primary-green rounded-full animate-pulse delay-75" />
            <div className="w-1 h-1 bg-primary-green rounded-full animate-pulse delay-150" />
        </div>
      </div>

      <div className="flex items-center gap-6">
        
        {/* The Crystal Icon */}
        <div className="w-16 h-16 shrink-0 border border-primary-green/50 rounded-full bg-black/50 relative overflow-hidden">
            <div className="absolute inset-0 opacity-80">
                <MiniCrystalCanvas />
            </div>
        </div>

        {/* Address Info */}
        <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] text-primary-green-dim font-bold tracking-widest uppercase mb-1">
                ACCEPTED: ETH & STABLECOINS
            </span>
            <div className="flex items-baseline gap-3">
                <h3 className="text-2xl font-header font-black text-white tracking-wider truncate">
                    {ensName}
                </h3>
            </div>
            {/* The Flavor Text 0x Address */}
            <div className="text-[9px] font-mono text-primary-green/40 truncate mt-1 select-all">
                {ethAddress}
            </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleCopy}
        onMouseEnter={() => AudioSystem.playHover()}
        className={clsx(
            "flex items-center justify-center gap-3 py-4 w-full border font-mono text-xs font-bold tracking-widest transition-all uppercase",
            copied 
                ? "bg-primary-green text-black border-primary-green shadow-[0_0_20px_#78F654]" 
                : "bg-transparent text-primary-green border-primary-green/50 hover:bg-primary-green/10 hover:border-primary-green hover:shadow-[0_0_10px_rgba(120,246,84,0.2)]"
        )}
      >
        {copied ? (
            <>
                <Check size={16} />
                <span>SECURE_ADDRESS_COPIED</span>
            </>
        ) : (
            <>
                <Copy size={16} />
                <span>COPY_ADDRESS_TO_CLIPBOARD</span>
            </>
        )}
      </button>

      {/* Footer Info */}
      <div className="flex items-start gap-2 text-[9px] text-gray-500 font-mono leading-tight pt-2 border-t border-white/5">
        <Info size={12} className="shrink-0 mt-0.5" />
        <p>Supports ETH, BASE, ARB, OPT. Funds go directly to the development of MESOELFY_OS.</p>
      </div>
    </div>
  );
};
