import { ModalContainer } from '@/ui/overlays/ModalContainer';
import { Send } from 'lucide-react';

export const ContactModal = () => {
  return (
    <ModalContainer title="ENCRYPTED_UPLINK // CONTACT" type="contact">
      <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
        
        {/* Added Triangles and Font-Header for the Warning */}
        <div className="p-2 border border-elfy-yellow/30 bg-elfy-yellow/5 mb-6 text-center flex items-center justify-center gap-3">
          <span className="text-elfy-yellow animate-pulse">⚠</span>
          <p className="text-xs text-elfy-yellow font-header font-bold tracking-wider">
            WARNING: TRANSMISSIONS ARE MONITORED BY THE AI OVERLORD.
          </p>
          <span className="text-elfy-yellow animate-pulse">⚠</span>
        </div>

        <form 
          action="https://formspree.io/f/xkgdbkpz" 
          method="POST"
          className="space-y-6"
        >
          <div className="space-y-1">
            <label className="text-sm text-elfy-green-dim uppercase tracking-wider font-header font-bold">Codename</label>
            <input 
              type="text" 
              name="name"
              required
              placeholder="Enter your handle..."
              className="w-full bg-black border border-elfy-green-dim/50 p-3 text-elfy-green font-mono focus:border-elfy-green focus:outline-none focus:shadow-[0_0_10px_rgba(120,246,84,0.2)] transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-elfy-green-dim uppercase tracking-wider font-header font-bold">Frequency (Email)</label>
            <input 
              type="email" 
              name="email"
              required
              placeholder="Enter return frequency..."
              className="w-full bg-black border border-elfy-green-dim/50 p-3 text-elfy-green font-mono focus:border-elfy-green focus:outline-none focus:shadow-[0_0_10px_rgba(120,246,84,0.2)] transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-elfy-green-dim uppercase tracking-wider font-header font-bold">Payload</label>
            <textarea 
              name="message"
              required
              rows={5}
              placeholder="Type your message..."
              className="w-full bg-black border border-elfy-green-dim/50 p-3 text-elfy-green font-mono focus:border-elfy-green focus:outline-none focus:shadow-[0_0_10px_rgba(120,246,84,0.2)] transition-all resize-none"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-elfy-green text-black font-header font-black uppercase tracking-widest hover:bg-white transition-colors flex items-center justify-center gap-2 group"
          >
            <span>Send Transmission</span>
            <Send size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </ModalContainer>
  );
};
