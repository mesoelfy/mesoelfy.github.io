import { useGameStore } from '@/engine/state/game/useGameStore';
import { useStreamValue } from '@/ui/hooks/useStreamValue';
import identity from '@/engine/config/static/identity.json';
import { clsx } from 'clsx';
import { PanelId } from '@/engine/config/PanelConfig';
import { PALETTE } from '@/engine/config/Palette';
import { VitalsRing } from '@/ui/kit/atoms/VitalsRing';
import { UpgradeTerminal } from './UpgradeTerminal';
import { SystemOps } from './SystemOps';
import { IdentityFooter } from './IdentityFooter';

export const IdentityHUD = () => {
  // NEW: Stream-based State
  const hp = useStreamValue('PLAYER_HEALTH');
  const maxHp = useStreamValue('PLAYER_MAX_HEALTH');
  const xp = useStreamValue('XP');
  const nextXp = useStreamValue('XP_NEXT');
  const level = useStreamValue('LEVEL');
  const rebootProgress = useStreamValue('PLAYER_REBOOT');

  // Keep panel state (Slow Path, Structural)
  const panel = useGameStore(s => s.panels[PanelId.IDENTITY]);
  const isPanelDead = panel ? panel.isDestroyed : false;
  const isPlayerDead = hp <= 0;

  return (
    <div className={clsx("flex flex-col h-full w-full relative overflow-hidden", isPanelDead ? 'grayscale opacity-50 pointer-events-none' : '')}>
      <div className="flex-none flex flex-col items-center pt-4 relative z-10">
        <VitalsRing health={hp} maxHealth={maxHp} xp={xp} xpToNext={nextXp} level={level} isDead={isPlayerDead} rebootProgress={rebootProgress} />
        <div className="text-center z-20 mb-2">
            <h2 className="text-xl font-header font-black tracking-wider drop-shadow-md" style={{ color: PALETTE.GREEN.PRIMARY }}>{identity.name}</h2>
            <div className="text-[8px] uppercase tracking-[0.2em] opacity-80 bg-black/60 px-2 py-0.5 rounded-full border" style={{ color: PALETTE.PURPLE.LIGHT, borderColor: `${PALETTE.PURPLE.PRIMARY}33` }}>{identity.class}</div>
        </div>
      </div>
      <div className="flex-1 min-h-0 w-full px-4 overflow-y-auto scrollbar-hide relative pb-4">
         <div className={isPlayerDead ? "opacity-50 pointer-events-none" : ""}>
             <UpgradeTerminal isPanelDead={isPanelDead} />
             <SystemOps isPanelDead={isPanelDead} />
         </div>
      </div>
      <IdentityFooter isPanelDead={isPanelDead} />
    </div>
  );
};
