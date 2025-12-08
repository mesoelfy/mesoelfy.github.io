import { useEffect, useRef } from 'react';

interface ConsoleTabProps {
  logs: { time: string, msg: string, type: string }[];
}

export const ConsoleTab = ({ logs }: ConsoleTabProps) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
        logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 pr-2">
            {logs.map((l, i) => (
                <div key={i} className="flex gap-2 opacity-80 hover:opacity-100 border-b border-white/5 py-0.5">
                    <span className="text-elfy-green-dim">[{l.time}]</span>
                    <span className={l.type.includes('ERROR') ? 'text-elfy-red' : 'text-elfy-green'}>{l.msg}</span>
                </div>
            ))}
            <div ref={logEndRef} />
        </div>
    </div>
  );
};
