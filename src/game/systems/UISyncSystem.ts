import { IGameSystem, IServiceLocator } from '@/engine/interfaces';
import { useGameStore } from '../store/useGameStore';
import { GameStateSystem } from './GameStateSystem';
import { PanelRegistry } from './PanelRegistrySystem';
import { InteractionSystem } from './InteractionSystem';
import { TransientDOMService } from '@/game/services/TransientDOMService';

export class UISyncSystem implements IGameSystem {
  private gameSystem!: GameStateSystem;
  private interactionSystem!: InteractionSystem;
  
  private readonly SYNC_INTERVAL = 0.1; // 10Hz
  private timeSinceLastSync = 0;

  setup(locator: IServiceLocator): void {
    this.gameSystem = locator.getSystem<GameStateSystem>('GameStateSystem');
    this.interactionSystem = locator.getSystem<InteractionSystem>('InteractionSystem');
  }

  update(delta: number, time: number): void {
    this.timeSinceLastSync += delta;
    if (this.timeSinceLastSync < this.SYNC_INTERVAL) return;
    this.timeSinceLastSync = 0;
    this.sync();
  }

  teardown(): void {}

  private sync() {
    const store = useGameStore.getState();
    
    // 1. FAST PATH: Direct DOM Updates
    const formattedScore = this.gameSystem.score.toString().padStart(4, '0');
    TransientDOMService.update('score-display', formattedScore);
    
    // 2. SLOW PATH: React State Sync
    // OPTIMIZATION: Strict check. If absolutely nothing relevant changed, do not call set().
    const gs = this.gameSystem;
    
    const hasChanged = 
        store.playerHealth !== gs.playerHealth || 
        store.playerRebootProgress !== gs.playerRebootProgress || 
        store.xp !== gs.xp || 
        store.score !== gs.score ||
        store.level !== gs.level ||
        store.upgradePoints !== gs.upgradePoints ||
        store.interactionTarget !== this.interactionSystem.hoveringPanelId ||
        Math.abs(store.systemIntegrity - PanelRegistry.systemIntegrity) > 1.0; 

    if (hasChanged) {
        store.syncGameState({
            playerHealth: gs.playerHealth, 
            playerRebootProgress: gs.playerRebootProgress, 
            level: gs.level,
            xp: gs.xp,
            score: gs.score,
            xpToNextLevel: gs.xpToNextLevel,
            upgradePoints: gs.upgradePoints,
            activeUpgrades: { ...gs.activeUpgrades }, // Shallow copy needed
            systemIntegrity: PanelRegistry.systemIntegrity,
            interactionTarget: this.interactionSystem.hoveringPanelId 
        });
    }

    // 3. Panel Sync (Very Slow path)
    // Only sync panels if one was actually destroyed/healed recently? 
    // For now, we trust the React memoization in GlassPanel to reject updates if props match.
    // But we can optimize data creation:
    
    // Check if we need to sync panel state at all (e.g. any damage taken?)
    // This is hard to diff cheaply. For now, we rely on the 10Hz throttle.
    const uiPanels: Record<string, any> = {};
    const panels = PanelRegistry.getAllPanels();
    let panelsChanged = false;

    for(const p of panels) {
        const prev = store.panels[p.id];
        // Only update if data diff (prevents object identity churn)
        if (!prev || prev.health !== p.health || prev.isDestroyed !== p.isDestroyed) {
            uiPanels[p.id] = {
                id: p.id,
                health: p.health,
                isDestroyed: p.isDestroyed
            };
            panelsChanged = true;
        }
    }
    
    if (panelsChanged) {
        store.syncPanels(uiPanels);
    }
  }
}
