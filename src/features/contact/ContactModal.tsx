import { ModalContainer } from '@/ui/overlays/ModalContainer';
import { Send, Terminal, Signal, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { clsx } from 'clsx';

export const ContactModal = () => {
  const [status, setStatus] = useState<'IDLE' | 'SENDING' | 'SENT' | 'ERROR'>('IDLE');
  const [signalStrength, setSignalStrength] = useState(0);

  const handleInput = () => {
      // Fluctuate signal on typing
      setSignalStrength(Math.floor(Math.random() * 40) + 60);
      AudioSystem.playSound('ui_hover'); // Subtle chirp
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setStatus('SENDING');
      AudioSystem.playSound('ui_click');
      AudioSystem.playRebootZap();

      const form = e.currentTarget;
      const data = new FormData(form);
      
      try {
          const res = await fetch("https://formspree.io/f/xkgdbkpz", {
              method: "POST",
              body: data,
              headers: { 'Accept': 'application/json' }
          });
          
          if (res.ok) {
              setStatus('SENT');
              AudioSystem.playSound('fx_reboot_success');
          } else {
              setStatus('ERROR');
              AudioSystem.playSound('ui_error');
          }
      } catch (err) {
          setStatus('ERROR');
          AudioSystem.playSound('ui_error');
      }
  };

  return (
    <ModalContainer title="SECURE_UPLINK // TERMINAL_01" type="contact">
      <div className="max-w-3xl mx-auto h-full flex flex-col relative overflow-hidden">
        
        {/* DECORATIVE BACKGROUND */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-green rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-service-cyan rounded-full blur-[100px]" />
        </div>

        {/* STATUS BAR */}
        <div className="flex items-center justify-between p-4 border-b border-primary-green/20 bg-black/40 backdrop-blur-sm z-10 shrink-0">
            <div className="flex items-center gap-3">
                <div className={clsx("w-3 h-3 rounded-full animate-pulse", status === 'ERROR' ? "bg-critical-red" : "bg-primary-green")} />
                <span className="font-mono text-xs font-bold text-primary-green tracking-widest">
                    CONNECTION: {status === 'IDLE' ? 'STABLE' : status}
                </span>
            </div>
            <div className="flex items-center gap-2 text-primary-green/60 font-mono text-[10px]">
                <Signal size={14} />
                <span>SIG: {signalStrength}%</span>
            </div>
        </div>

        {/* MAIN TERMINAL */}
        <div className="flex-1 relative p-6 md:p-12 overflow-y-auto z-10">
            
            <AnimatePresence mode="wait">
                {status === 'SENT' ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-full flex flex-col items-center justify-center text-center gap-6"
                    >
                        <motion.div 
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className="w-24 h-24 rounded-full border-4 border-primary-green flex items-center justify-center bg-primary-green/10"
                        >
                            <ShieldCheck size={48} className="text-primary-green" />
                        </motion.div>
                        <div>
                            <h2 className="text-3xl font-header font-black text-white tracking-widest mb-2">TRANSMISSION CONFIRMED</h2>
                            <p className="text-primary-green-dim font-mono">The payload has been delivered to the mainframe.</p>
                        </div>
                        <button 
                            onClick={() => setStatus('IDLE')}
                            className="mt-8 px-8 py-3 border border-primary-green/50 hover:bg-primary-green hover:text-black transition-all font-bold font-mono text-xs tracking-widest"
                        >
                            SEND_ANOTHER
                        </button>
                    </motion.div>
                ) : (
                    <motion.form 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        onSubmit={handleSubmit}
                        className="space-y-8 max-w-xl mx-auto"
                    >
                        {/* TERMINAL HEADER */}
                        <div className="font-mono text-primary-green text-sm mb-8 opacity-70">
                            <p>&gt; ESTABLISHING SECURE TUNNEL...</p>
                            <p>&gt; ENCRYPTION KEY: RSA-4096</p>
                            <p>&gt; READY FOR INPUT.</p>
                        </div>

                        {/* INPUT: NAME */}
                        <div className="group relative">
                            <label className="absolute -top-3 left-0 text-[10px] font-bold text-primary-green/50 font-mono tracking-widest uppercase bg-black px-1 group-focus-within:text-primary-green transition-colors">
                                CODENAME (Required)
                            </label>
                            <div className="flex items-center border-b border-primary-green/30 group-focus-within:border-primary-green transition-colors py-2">
                                <span className="text-primary-green mr-2 font-mono opacity-50">&gt;</span>
                                <input 
                                    type="text" 
                                    name="name"
                                    required
                                    onKeyDown={handleInput}
                                    className="w-full bg-transparent text-white font-mono focus:outline-none placeholder:text-gray-700 uppercase"
                                    placeholder="ENTER_IDENTITY"
                                />
                            </div>
                        </div>

                        {/* INPUT: EMAIL */}
                        <div className="group relative">
                            <label className="absolute -top-3 left-0 text-[10px] font-bold text-primary-green/50 font-mono tracking-widest uppercase bg-black px-1 group-focus-within:text-primary-green transition-colors">
                                RETURN_ADDRESS (Required)
                            </label>
                            <div className="flex items-center border-b border-primary-green/30 group-focus-within:border-primary-green transition-colors py-2">
                                <span className="text-primary-green mr-2 font-mono opacity-50">&gt;</span>
                                <input 
                                    type="email" 
                                    name="email"
                                    required
                                    onKeyDown={handleInput}
                                    className="w-full bg-transparent text-white font-mono focus:outline-none placeholder:text-gray-700"
                                    placeholder="user@netscape.com"
                                />
                            </div>
                        </div>

                        {/* INPUT: MESSAGE */}
                        <div className="group relative">
                            <label className="absolute -top-3 left-0 text-[10px] font-bold text-primary-green/50 font-mono tracking-widest uppercase bg-black px-1 group-focus-within:text-primary-green transition-colors">
                                PAYLOAD (Message)
                            </label>
                            <div className="flex items-start border-b border-primary-green/30 group-focus-within:border-primary-green transition-colors py-2">
                                <span className="text-primary-green mr-2 font-mono opacity-50 mt-1">&gt;</span>
                                <textarea 
                                    name="message"
                                    required
                                    rows={4}
                                    onKeyDown={handleInput}
                                    className="w-full bg-transparent text-white font-mono focus:outline-none placeholder:text-gray-700 resize-none"
                                    placeholder="Type your transmission here..."
                                />
                            </div>
                        </div>

                        {/* ACTION BAR */}
                        <div className="pt-6">
                            <button 
                                type="submit"
                                disabled={status === 'SENDING'}
                                className={clsx(
                                    "w-full py-4 font-header font-black text-lg tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-4 relative overflow-hidden group btn-glitch",
                                    status === 'SENDING' 
                                        ? "bg-primary-green/20 text-primary-green cursor-wait" 
                                        : "bg-primary-green text-black hover:bg-white"
                                )}
                            >
                                {status === 'SENDING' ? (
                                    <>
                                        <Terminal size={20} className="animate-spin" />
                                        UPLOADING...
                                    </>
                                ) : (
                                    <>
                                        <span>INITIATE_UPLINK</span>
                                        <Send size={20} className="group-hover:translate-x-2 transition-transform" />
                                    </>
                                )}
                                
                                {/* Button Scanline */}
                                {!status && (
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                                )}
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
      </div>
    </ModalContainer>
  );
};
