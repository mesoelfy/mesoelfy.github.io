import { useGameStore } from '@/engine/state/game/useGameStore';
import { useStreamValue } from '@/ui/hooks/useStreamValue';
import { clsx } from 'clsx';
import { PanelId } from '@/engine/config/PanelConfig';
import { VitalsRing } from '@/ui/kit/atoms/VitalsRing';
import { UpgradeTerminal } from './UpgradeTerminal';
import { RepairButton, PurgeButton } from './SystemOps';
import { IdentityFooter } from './IdentityFooter';

export const IdentityHUD = () => {
  const hp = useStreamValue('PLAYER_HEALTH');
  const maxHp = useStreamValue('PLAYER_MAX_HEALTH');
  const xp = useStreamValue('XP');
  const nextXp = useStreamValue('XP_NEXT');
  const level = useStreamValue('LEVEL');
  const rebootProgress = useStreamValue('PLAYER_REBOOT');

  const panel = useGameStore(s => s.panels[PanelId.IDENTITY]);
  const isPanelDead = panel ? panel.isDestroyed : false;
  const isPlayerDead = hp <= 0;

  return (
    <div className={clsx("flex flex-col h-full w-full relative overflow-hidden", isPanelDead ? 'grayscale opacity-50 pointer-events-none' : '')}>
      
      {/* TOP SECTION: Centered Layout */}
      <div className="flex-none flex items-center justify-center gap-8 p-6 pb-2 border-b border-primary-green/10">
          
          {/* Left: Repair */}
          <div className="flex items-center">
              <RepairButton isPanelDead={isPanelDead} />
          </div>

          {/* Center: Crystal */}
          <div className="flex items-center justify-center">
              <VitalsRing health={hp} maxHealth={maxHp} xp={xp} xpToNext={nextXp} level={level} isDead={isPlayerDead} rebootProgress={rebootProgress} />
          </div>

          {/* Right: Purge */}
          <div className="flex items-center">
              <PurgeButton isPanelDead={isPanelDead} />
          </div>
      </div>

      {/* BOTTOM SECTION: Upgrade Badges */}
      <div className="flex-1 min-h-0 w-full px-4 overflow-y-auto scrollbar-hide relative py-4">
         <div className={isPlayerDead ? "opacity-50 pointer-events-none" : ""}>
             <UpgradeTerminal isPanelDead={isPanelDead} />
         </div>
      </div>
      
      <IdentityFooter isPanelDead={isPanelDead} />
    </div>
  );
};
