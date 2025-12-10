import { useStore } from '@/core/store/useStore';
import { AudioSystem } from '@/core/audio/AudioSystem';

interface IdentityFooterProps {
  isPanelDead: boolean;
}

export const IdentityFooter = ({ isPanelDead }: IdentityFooterProps) => {
  const { openModal } = useStore();

  const handleClick = (modal: 'about' | 'contact') => {
      if (isPanelDead) return;
      AudioSystem.playClick();
      openModal(modal);
  };

  return (
    <div className="flex-none grid grid-cols-2 gap-px bg-primary-green-dim/20 border-t border-primary-green-dim/30 mt-auto">
      <button 
        onClick={() => handleClick('about')} 
        onMouseEnter={() => !isPanelDead && AudioSystem.playHover()}
        className="py-3 bg-black/80 hover:bg-primary-green hover:text-black text-primary-green text-[10px] font-bold font-header uppercase transition-colors tracking-widest"
      >
        About_Me
      </button>
      <button 
        onClick={() => handleClick('contact')} 
        onMouseEnter={() => !isPanelDead && AudioSystem.playHover()}
        className="py-3 bg-black/80 hover:bg-alert-yellow hover:text-black text-alert-yellow text-[10px] font-bold font-header uppercase transition-colors tracking-widest"
      >
        Contact_Link
      </button>
    </div>
  );
};
