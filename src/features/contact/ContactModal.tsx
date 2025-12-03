import { ModalContainer } from '@/ui/overlays/ModalContainer';
import { Send } from 'lucide-react';

export const ContactModal = () => {
  return (
    <ModalContainer title="ENCRYPTED_UPLINK // CONTACT" type="contact">
      <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
        <div className="p-1 border border-elfy-yellow/30 bg-elfy-yellow/5 mb-6 text-center">
          <p className="text-xs text-elfy-yellow font-mono">
            WARNING: TRANSMISSIONS ARE MONITORED BY THE AI OVERLORD.
          </p>
        </div>

        <form 
          action="https://formspree.io/f/xkgdbkpz" 
          method="POST"
          className="space-y-6 font-mono"
        >
          <div className="space-y-1">
            <label className="text-sm text-elfy-green-dim uppercase tracking-wider">Codename</label>
            <input 
              type="text" 
              name="name"
              required
              placeholder="Enter your handle..."
              className="w-full bg-black border border-elfy-green-dim/50 p-3 text-elfy-green focus:border-elfy-green focus:outline-none focus:shadow-[0_0_10px_rgba(120,246,84,0.2)] transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-elfy-green-dim uppercase tracking-wider">Frequency (Email)</label>
            <input 
              type="email" 
              name="email"
              required
              placeholder="Enter return frequency..."
              className="w-full bg-black border border-elfy-green-dim/50 p-3 text-elfy-green focus:border-elfy-green focus:outline-none focus:shadow-[0_0_10px_rgba(120,246,84,0.2)] transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-elfy-green-dim uppercase tracking-wider">Payload</label>
            <textarea 
              name="message"
              required
              rows={5}
              placeholder="Type your message..."
              className="w-full bg-black border border-elfy-green-dim/50 p-3 text-elfy-green focus:border-elfy-green focus:outline-none focus:shadow-[0_0_10px_rgba(120,246,84,0.2)] transition-all resize-none"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-elfy-green text-black font-bold uppercase tracking-widest hover:bg-white transition-colors flex items-center justify-center gap-2 group"
          >
            <span>Send Transmission</span>
            <Send size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </ModalContainer>
  );
};
