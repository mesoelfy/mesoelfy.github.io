import { useEffect, useRef, useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface ConsoleTabProps {
  logs: { time: string, msg: string, type: string }[];
}

export const ConsoleTab = ({ logs }: ConsoleTabProps) => {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (logEndRef.current) {
        logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleCopy = () => {
      const text = logs.map(l => `[${l.time}] ${l.msg}`).join('\n');
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col relative">
        <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 pr-2 pb-8">
            {logs.length === 0 && (
                <div className="text-primary-green-dim opacity-50 italic mt-4">-- NO SIGNIFICANT EVENTS --</div>
            )}
            {logs.map((l, i) => (
                <div key={i} className="flex gap-2 opacity-80 hover:opacity-100 border-b border-white/5 py-0.5">
                    <span className="text-primary-green-dim shrink-0">[{l.time}]</span>
                    <span className={l.type.includes('ERROR') || l.type.includes('CRITICAL') ? 'text-critical-red font-bold' : 'text-primary-green break-all'}>{l.msg}</span>
                </div>
            ))}
            <div ref={logEndRef} />
        </div>
        
        <button 
            onClick={handleCopy}
            className="absolute bottom-0 right-0 flex items-center gap-2 bg-primary-green/10 hover:bg-primary-green/20 border border-primary-green/30 text-primary-green px-3 py-1.5 text-xs font-bold transition-all backdrop-blur-sm"
        >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "COPIED" : "COPY LOG"}
        </button>
    </div>
  );
};
