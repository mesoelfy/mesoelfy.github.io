import { useGameStore } from '@/game/state/game/useGameStore';
import identity from '@/game/config/static/identity.json';
import { clsx } from 'clsx';

// Sub-components
import { VitalsRing } from '@/ui/kit/atoms/VitalsRing';
import { UpgradeTerminal } from './UpgradeTerminal';
import { SystemOps } from './SystemOps';
import { IdentityFooter } from './IdentityFooter';

export const IdentityHUD = () => {
  
  // -- Vitals State (Heavy Updates) --
  const hp = useGameStore(s => s.playerHealth);
  const maxHp = useGameStore(s => s.maxPlayerHealth);
  const xp = useGameStore(s => s.xp);
  const nextXp = useGameStore(s => s.xpToNextLevel);
  const level = useGameStore(s => s.level);
  const rebootProgress = useGameStore(s => s.playerRebootProgress);
  
  // -- Panel State --
  const panel = useGameStore(s => s.panels['identity']);
  const isPanelDead = panel ? panel.isDestroyed : false;
  const isPlayerDead = hp <= 0;

  return (
    <div className={clsx(
        "flex flex-col h-full w-full relative overflow-hidden", 
        isPanelDead ? 'grayscale opacity-50 pointer-events-none' : ''
    )}>
      
      {/* TOP SECTION: Avatar & Stats */}
      <div className="flex-none flex flex-col items-center pt-4 relative z-10">
        
        {/* Vitals Ring (Atomic Component) */}
        <VitalsRing 
            health={hp}
            maxHealth={maxHp}
            xp={xp}
            xpToNext={nextXp}
            level={level}
            isDead={isPlayerDead}
            rebootProgress={rebootProgress}
        />

        {/* Identity Info */}
        <div className="text-center z-20 mb-2">
            <h2 className="text-xl font-header font-black text-primary-green tracking-wider drop-shadow-md">
                {identity.name}
            </h2>
            <div className="text-[8px] text-latent-purple-light uppercase tracking-[0.2em] opacity-80 bg-black/60 px-2 py-0.5 rounded-full border border-latent-purple/20">
                {identity.class}
            </div>
        </div>
      </div>

      {/* MIDDLE SECTION: Upgrade Terminal */}
      <div className="flex-1 min-h-0 w-full px-4 overflow-y-auto scrollbar-hide relative pb-4">
         {/* We pass isPanelDead/isPlayerDead to disable interaction inside */}
         {/* UpgradeTerminal handles its own subscriptions to points/upgrades */}
         <div className={isPlayerDead ? "opacity-50 pointer-events-none" : ""}>
             <UpgradeTerminal isPanelDead={isPanelDead} />
             <SystemOps isPanelDead={isPanelDead} />
         </div>
      </div>

      {/* BOTTOM SECTION: Footer Links */}
      <IdentityFooter isPanelDead={isPanelDead} />
    </div>
  );
};
