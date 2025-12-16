import { IGameSystem, IServiceLocator, IPanelSystem, IInteractionSystem } from '@/engine/interfaces';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { GameStateSystem } from './GameStateSystem';
import { TransientDOMService } from '@/engine/services/TransientDOMService';

export class UISyncSystem implements IGameSystem {
  private gameSystem!: GameStateSystem;
  private interactionSystem!: IInteractionSystem;
  private panelSystem!: IPanelSystem;
  
  private readonly SYNC_INTERVAL = 0.1; 
  private timeSinceLastSync = 0;

  setup(locator: IServiceLocator): void {
    this.gameSystem = locator.getSystem<GameStateSystem>('GameStateSystem');
    this.interactionSystem = locator.getSystem<IInteractionSystem>('InteractionSystem');
    this.panelSystem = locator.getSystem<IPanelSystem>('PanelRegistrySystem');
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
    const gs = this.gameSystem;
    
    // 1. Transient DOM (High Frequency)
    // We update this every sync tick because it's cheap (direct DOM manipulation)
    const formattedScore = gs.score.toString().padStart(4, '0');
    TransientDOMService.update('score-display', formattedScore);
    
    // 2. React State (Medium Frequency)
    // Only update if values changed to prevent React re-renders
    if (store.score !== gs.score) store.setScore(gs.score);
    if (store.playerHealth !== gs.playerHealth) store.setPlayerHealth(gs.playerHealth);
    if (store.playerRebootProgress !== gs.playerRebootProgress) store.setPlayerRebootProgress(gs.playerRebootProgress);
    if (Math.abs(store.systemIntegrity - this.panelSystem.systemIntegrity) > 1.0) {
        store.setSystemIntegrity(this.panelSystem.systemIntegrity);
    }

    // Bulk update progression data if any part changed
    if (store.xp !== gs.xp || store.level !== gs.level || store.upgradePoints !== gs.upgradePoints) {
        store.setProgressionData({
            xp: gs.xp,
            level: gs.level,
            nextXp: gs.xpToNextLevel,
            points: gs.upgradePoints
        });
    }

    // 3. Panel Sync (Slow / Complex Object)
    const uiPanels: Record<string, any> = {};
    const panels = this.panelSystem.getAllPanels();
    let panelsChanged = false;

    for(const p of panels) {
        const prev = store.panels[p.id];
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
