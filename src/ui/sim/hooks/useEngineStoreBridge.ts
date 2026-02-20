import { useEffect, useCallback } from 'react';
import { useStore } from '@/engine/state/global/useStore';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { GameEngineCore } from '@/engine/services/GameEngine';

export const useEngineStoreBridge = (engineRef: React.MutableRefObject<GameEngineCore | null>) => {
    
    const forceSync = useCallback(() => {
        const store = useStore.getState();
        const gameStore = useGameStore.getState();
        
        GameEventBus.emit(GameEvents.GLOBAL_STATE_SYNC, {
            bootState: store.bootState,
            isZenMode: gameStore.isZenMode,
            graphicsMode: store.graphicsMode,
            debugFlags: store.debugFlags,
            weaponState: {
                spitter: gameStore.spitter,
                sniffer: gameStore.sniffer
            }
        });

        if (engineRef.current) {
            const isMenuOpen = store.activeModal !== 'none';
            const isDebugBlocking = store.isDebugOpen && !store.isDebugMinimized;
            const isPaused = store.isSimulationPaused || isMenuOpen || isDebugBlocking;
            
            engineRef.current.setEngineState({
                isPaused,
                isWarmingUp: store.bootState === 'standby',
                timeScale: store.debugFlags.timeScale
            });
        }
    }, [engineRef]);

    useEffect(() => {
        const unsub1 = useStore.subscribe(forceSync);
        const unsub2 = useGameStore.subscribe(forceSync);
        return () => { unsub1(); unsub2(); };
    }, [forceSync]);

    useEffect(() => {
        const subs = [
            GameEventBus.subscribe(GameEvents.CMD_REGISTER_PANEL, p => useGameStore.getState().registerPanel(p.id, p.element)),
            GameEventBus.subscribe(GameEvents.CMD_UNREGISTER_PANEL, p => useGameStore.getState().unregisterPanel(p.id)),
            GameEventBus.subscribe(GameEvents.CMD_DAMAGE_PANEL, p => useGameStore.getState().damagePanel(p.id, p.amount, p.options)),
            GameEventBus.subscribe(GameEvents.CMD_HEAL_PANEL, p => useGameStore.getState().healPanel(p.id, p.amount, p.sourceX)),
            GameEventBus.subscribe(GameEvents.CMD_DECAY_PANEL, p => useGameStore.getState().decayPanel(p.id, p.amount)),
            GameEventBus.subscribe(GameEvents.CMD_DESTROY_ALL_PANELS, () => useGameStore.getState().destroyAllPanels()),
            GameEventBus.subscribe(GameEvents.CMD_SET_INTERACTION_TARGET, p => useGameStore.getState().setInteractionTarget(p.id)),
            GameEventBus.subscribe(GameEvents.CMD_SET_SCORE, p => useGameStore.getState().setScore(p.score)),
            GameEventBus.subscribe(GameEvents.THREAT_LEVEL_UP, () => useGameStore.setState(s => ({ upgradePoints: s.upgradePoints + 1 })))
        ];
        return () => subs.forEach(unsub => unsub());
    }, []);

    return forceSync;
};
